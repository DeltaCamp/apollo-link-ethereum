import { Operation, NextLink, Observable, FetchResult, ApolloLink } from 'apollo-link'
import {
  hasDirectives,
  getMainDefinition
} from 'apollo-utilities'
import { EthereumResolver } from './EthereumResolver'
import { removeEthereumSetsFromDocument } from './removeEthereumSetsFromDocument'
import { graphql } from './graphql-anywhere/graphql'
import { resolvePromises, promiseEntry } from './resolvePromises'
import { resolverFactory } from './resolverFactory'

// Using some code taken from https://github.com/apollographql/apollo-link-state/blob/master/packages/apollo-link-state/src/index.ts

const debug = require('debug')('apollo-link-ethereum:EthereumLink')

export class EthereumLink extends ApolloLink {
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

    const isEthereum = hasDirectives(['contract', 'block'], query)

    if (!isEthereum) {
      return forward ? forward(operation) : null
    }

    const nonContractQuery = removeEthereumSetsFromDocument(query)

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

      // Works around race condition between completion and graphql execution
      // finishing. If complete is called during the graphql call, we will
      // miss out on the result, since the observer will have completed
      let complete = false;
      let handlingNext = false;

      const observerErrorHandler = (error) => {
        console.error('wtf? ', error)
      }

      obs.subscribe({
        next: (args) => {
          const { data, errors } = args

          if (errors) {
            console.error('many errors: ', errors)
          }

          const context = operation.getContext();

          let { resolver, resolverAfter, promises, subscriptions } = resolverFactory(this.ethereumResolver, isSubscription)

          handlingNext = true
          //data is from the server and provides the root value to this GraphQL resolution
          //when there is no resolver, the data is taken from the context
          const nextData = graphql(resolver, query, data, context, operation.variables, {
            resolverAfter
          })

          function promiseFinally() {
            var errors = resolvePromises(nextData)

            debug(`promiseFinally: `, nextData, ` errors: `, errors)

            if (errors && errors.length) {
              errors = [
                {
                  message: `Error resolving query:\n\n ${JSON.stringify(defn)}:\n\n ${JSON.stringify(errors)}\n\n`,
                  query,
                  errors
                }
              ]
            }

            observer.next({
              data: nextData,
              errors,
            });

            if (complete) {
              observer.complete();
            }

            handlingNext = false;
          }

          if (isSubscription) {
            subscriptions.forEach(subscription => {
              subscription.subscribe({
                next: (_) => {
                  debug(`subscription.subscribe: `, nextData)
                  observer.next({
                    data: nextData
                  })
                }
              })
            })
          } else {
            Promise
              .all(promises)
              .then(promiseFinally)
              .catch(promiseFinally)
          }
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
