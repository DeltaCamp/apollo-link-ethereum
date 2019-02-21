import { sendTransaction } from './sendTransaction'

export function sendTransactionWithOptions(options) {
  return function () {
    const args = [options].concat(Array.from(arguments))
    // @ts-ignore: TS2556
    return sendTransaction(...args)
  }
}
