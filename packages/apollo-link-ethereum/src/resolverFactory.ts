import { Observable, FetchResult } from 'apollo-link'
import { promiseEntry } from './resolvePromises'

export const resolverFactory = (ethereumResolver, isSubscription) => {
  let promises = []
  let subscriptions = []
  let contract: string = null
  let contractDirectives = null

  const resolver = function (fieldName, rootValue = {}, args, context, info) {
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
      let entry
      if (isSubscription) {
        let observable = ethereumResolver.subscribe(contract, contractDirectives, fieldName, args, info.directives)
        observable['fieldName'] = fieldName

        entry = {
          result: null,
          error: null
        }

        var dataObservable = new Observable<FetchResult>(observer => {
          observable.subscribe({
            next: (data) => {
              entry.result = data
              observer.next(data)
            },
            error: (error) => {
              entry.error = error
              observer.error(error)
            }
          })
        })

        subscriptions.push(dataObservable)
      } else {
        entry = promiseEntry(ethereumResolver.resolve(contract, contractDirectives, fieldName, args, info.directives))
        promises.push(entry.promise)
      }
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
    promises,
    subscriptions,
    resolver,
    resolverAfter
  }
}
