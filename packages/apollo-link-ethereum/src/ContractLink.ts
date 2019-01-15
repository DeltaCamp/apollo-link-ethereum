import { Operation, NextLink, Observable, FetchResult, ApolloLink } from 'apollo-link'
import {
  hasDirectives,
  // getMainDefinition
} from 'apollo-utilities'
import { EthereumResolver } from './EthereumResolver'
import { removeContractSetsFromDocument } from './removeContractSetsFromDocument'
import { graphql } from './graphql-anywhere/graphql'
import { resolvePromises, promiseEntry } from './resolvePromises'

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

    const server = removeContractSetsFromDocument(query)

    const resolverFactory = (promises) => {
      let contract: string = null
      let contractDirectives = null

      const resolver = (fieldName, rootValue = {}, args, context, info) => {
        const { resultKey } = info;

        const aliasedNode = rootValue[resultKey]; // where data is stored for user aliases
        const preAliasingNode = rootValue[fieldName]; // where data is stored in canonical model
        const aliasNeeded = resultKey !== fieldName;

        // if data already exists, return it!
        if (aliasedNode !== undefined || preAliasingNode !== undefined) {
          return aliasedNode || preAliasingNode;
        }

        // otherwise, run the web3 resolver
        // debug(`resolver: `, fieldName, rootValue, args, context, info, contract)

        if (info.directives && info.directives.hasOwnProperty('contract')) {
          contract = fieldName
          contractDirectives = info.directives.contract
        } else if (contract) {
          var entry = promiseEntry(this.ethereumResolver.resolve(contract, contractDirectives, fieldName, args, info.directives))
          promises.push(entry.promise)
          return entry
        }

        return (
          // Support nested fields
          (aliasNeeded ? aliasedNode : preAliasingNode) ||
          {}
        );
      }

      const resolverAfter = (fieldName, rootValue = {}, args, context, info) => {
        if (info.directives && info.directives.contract) {
          contract = null
        }
      }

      return {
        resolver,
        resolverAfter
      }
    }

    if (server) operation.query = server;
    const obs =
      server && forward
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

      const observerErrorHandler = observer.error.bind(observer);

      obs.subscribe({
        next: ({ data, errors }) => {
          const context = operation.getContext();
          const promises = []
          const { resolver, resolverAfter } = resolverFactory(promises)

          handlingNext = true
          //data is from the server and provides the root value to this GraphQL resolution
          //when there is no resolver, the data is taken from the context
          const nextData = graphql(resolver, query, data, context, operation.variables, {
            resolverAfter
          })

          function promiseFinally() {
            resolvePromises(nextData)

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
          if (!handlingNext) {
            observer.complete();
          }
          complete = true;
        },
      })
    })
  }
}
