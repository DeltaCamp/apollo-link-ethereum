export interface PromiseModel {
  result: any
  error: any
  promise: Promise<any>
}

export function promiseEntry(promise) {
  if (!promise) throw new Error('promise is not defined')
  const entry:PromiseModel = {
    result: null,
    error: null,
    promise
  }
  promise
    .then((result) => {
      entry.result = result
    })
    .catch((error) => {
      entry.error = error
    })
  return entry
}

export function resolvePromises(object) {
  for (var key in object) {
    if (!object.hasOwnProperty(key)) {
      continue
    }
    var value = object[key]
    if (value.promise && value.promise instanceof Promise) {
      if (value.result) {
        object[key] = value.result
      } else if (value.error) {
        delete value['promise']
        delete value['result']
      }
    } else if (Array.isArray(value) || typeof value === 'object') {
      resolvePromises(object[key])
    }
  }
}
