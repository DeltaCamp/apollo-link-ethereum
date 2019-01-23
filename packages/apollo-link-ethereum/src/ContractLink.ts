import { Operation, NextLink, Observable, FetchResult, ApolloLink } from 'apollo-link'
import {
  hasDirectives,
  getMainDefinition
} from 'apollo-utilities'
import { EthereumResolver } from './EthereumResolver'
import { removeContractSetsFromDocument } from './removeContractSetsFromDocument'
import { graphql } from './graphql-anywhere/graphql'
import { resolvePromises, promiseEntry } from './resolvePromises'
import { resolverFactory } from './resolverFactory'

// Using some code taken from https://github.com/apollographql/apollo-link-state/blob/master/packages/apollo-link-state/src/index.ts

export class ContractLink extends ApolloLink {
  ethereumResolver: EthereumResolver

  constructor (ethereumResolver?: EthereumResolver) {
    super()
    this.ethereumResolver = ethereumResolver
  }

  public request(
    operation: Operation,
    forward: NextLink,
  ): Observable<FetchResult> {
    const { query } = operation

    const isContract = hasDirectives(['contract'], query)
    if (!isContract) {
      return forward ? forward(operation) : null
    }

    const nonContractQuery = removeContractSetsFromDocument(query)

    const defn = getMainDefinition(query)

    const isSubscription = defn.operation === 'subscription'

    if (nonContractQuery) operation.query = nonContractQuery;
    const obs =
      nonContractQuery && forward
        ? forward(operation)
        : Observable.of({
            data: {},
          });

    return new Observable<FetchResult>(observer => {

      // console.log('Query operation name: ', operation.operationName)

      // Works around race condition between completion and graphql execution
      // finishing. If complete is called during the graphql call, we will
      // miss out on the result, since the observer will have completed
      let complete = false;
      let handlingNext = false;

      const observerErrorHandler = observer.error.bind(observer);

      obs.subscribe({
        next: ({ data, errors }) => {
          const context = operation.getContext();

          let { resolver, resolverAfter, promises, subscriptions } = resolverFactory(this.ethereumResolver, isSubscription)

          handlingNext = true
          //data is from the server and provides the root value to this GraphQL resolution
          //when there is no resolver, the data is taken from the context
          const nextData = graphql(resolver, query, data, context, operation.variables, {
            resolverAfter
          })

          subscriptions.forEach(subscription => {
            subscription.subscribe({
              next: (_) => {
                observer.next({
                  data: nextData
                })
              }
            })
          })

          function promiseFinally() {
            var errors = resolvePromises(nextData)

            observer.next({
              data: nextData,
              errors,
            });

            if (complete) {
              observer.complete();
            }

            handlingNext = false;
          }

          Promise
            .all(promises)
            .then(promiseFinally)
            .catch(promiseFinally)

        },
        error: observerErrorHandler,
        complete: () => {
          if (isSubscription) { return }
          if (!handlingNext) {
            observer.complete();
          }
          complete = true;
        },
      })

      return () => {
        observer.complete()
      }
    })
  }
}
