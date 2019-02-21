import { ethers } from 'ethers'
import { poll } from 'ethers/utils/web'
import { enableEthereum } from './enableEthereum'
import { allTransactionsQuery, transactionFragment } from './gql/index'

let nextTxId = 1

export async function sendTransaction(
  options, // ethers provider and apollo-link-ethereum abiMapping
  parentFieldResult, // parent field result
  variables, // arguments to mutation
  context, // context object
) {
  const { provider, abiMapping } = options
  const { cache, getCacheKey } = context
  try {
    const { contractName, method, args } = variables
    await enableEthereum()
    const network = await provider.getNetwork()
    const networkId = network.chainId
    const signer = provider.getSigner()
    const address = abiMapping.getAddress(contractName, networkId)
    const abi = abiMapping.getAbi(contractName)

    if (!address) {
      throw new Error(`No address for contract ${contractName} and network ${networkId}`)
    }

    if (!abi) {
      throw new Error(`No abi found for contract ${contractName}`)
    }

    const contract = new ethers.Contract(address, abi, signer)
    const methodFxn = contract[method]

    if (!methodFxn) {
      throw new Error(`Unknown function ${method} for contract Vouching`)
    }

    let data = { transactions: [] }
    const query = allTransactionsQuery

    const txId = nextTxId++

    try {
      data = cache.readQuery({ query })
    } catch (error) {
      console.error(error)
    }

    const newArgs = {
      values: Array.from(args).map(arg => arg.toString()),
      __typename: 'JSON'
    }

    const newTx = {
      __typename: 'Transaction',
      id: txId,
      method,
      contractName,
      completed: false,
      sent: false,
      hash: '',
      error: '',
      blockNumber: null,
      args: newArgs
    }

    if (data.transactions) {
      data.transactions.push(newTx)
    } else {
      data.transactions = [newTx]
    }

    cache.writeQuery({ query, data })

    const id = `Transaction:${txId}`
    const readTx = () => {
      return cache.readFragment({ fragment: transactionFragment, id })
    }

    let gasLimit
    try {
      gasLimit = await contract.estimate[method](...args)
    } catch (error) {
      console.error(error)
      const transaction = readTx()
      const data = { ...transaction, error: error.message }
      cache.writeData({ id, data })
      return data
    }

    // Hack to ensure it works!
    const newGasLimit = gasLimit.add(3000)

    const transactionData = contract.interface.functions[method].encode(args)
    const unsignedTransaction = {
      data: transactionData,
      to: contract.address,
      gasLimit: newGasLimit
    }

    signer.sendUncheckedTransaction(unsignedTransaction)
      .then(async function (hash) {
        let transaction = readTx()
        let data = { ...transaction, hash, sent: true }
        cache.writeData({ id, data })
        transaction = readTx()

        const receipt = await poll(() => {
          return provider.getTransactionReceipt(hash).then(receipt => {
            if (receipt === null) { return undefined }

            return receipt
          })
        }, { onceBlock: provider }).catch(error => {
          console.error(`Unable to get transaction receipt for tx with hash: ${hash} - `, error)
          throw error
        })

        if (receipt.status === 0) {
          throw new Error(`Ethereum tx had a 0 status. Tx hash: ${hash}`)
        }

        data = { ...transaction, blockNumber: receipt.blockNumber, completed: true }
        cache.writeData({ id, data })
      })
      .catch(error => {
        console.error(`Error occured while sending transaction`, error)

        const transaction = readTx()
        const data = { ...transaction, sent: true, completed: true, error: error.message }
        cache.writeData({ id, data })
      })

    return newTx
  } catch (error) {
    console.error('sendTransaction: ', variables, error)
    throw error
  }
}
