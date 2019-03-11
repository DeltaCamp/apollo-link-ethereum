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
    let address
    const { contractName, contractAddress, method, args } = variables
    await enableEthereum()
    const network = await provider.getNetwork()
    const networkId = network.chainId
    const signer = provider.getSigner()

    if (contractAddress) {
      address = contractAddress
    } else {
      try {
        address = abiMapping.getAddress(contractName, networkId)
      } catch (e) {
        throw new Error(`ALE Mutations Error: Unable to find contract '${contractName}' by contractName (perhaps need to pass in contractAddress?). Network ${networkId}`)
      }
    }

    const abi = abiMapping.getAbi(contractName)
    if (!abi) {
      throw new Error(`ALE Mutations Error: No abi found for contract ${contractName} (Forgot to pass contractName ?)`)
    }

    const contract = new ethers.Contract(address, abi, signer)
    const methodFxn = contract[method]

    if (!methodFxn) {
      throw new Error(`ALE Mutations Error: Unknown function ${method} for contract ${contractName}`)
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
      contractAddress: address,
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

    // let gasLimit = ethers.utils.bigNumberify(0)
    // try {
    //   gasLimit = await contract.estimate[method](...args)
    // } catch (error) {
    //   console.error(error)
    //   const transaction = readTx()
    //   const data = { ...transaction, error: error.message }
    //   cache.writeData({ id, data })
    //   return data
    // }

    // // Hack to ensure it works!
    // const newGasLimit = gasLimit.add(90000)

    const transactionData = contract.interface.functions[method].encode(args)
    const unsignedTransaction = {
      data: transactionData,
      to: contract.address,
      gasLimit: ethers.utils.bigNumberify(1000000) // TODO: this needs to be fixed!
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
          console.error(`ALE Mutations Error: Unable to get transaction receipt for tx with hash: ${hash} - `, error)
          throw error
        })

        if (receipt.status === 0) {
          throw new Error(`ALE Mutations Error: Ethereum tx had a 0 status. Tx hash: ${hash}`)
        }

        data = { ...transaction, blockNumber: receipt.blockNumber, completed: true }
        cache.writeData({ id, data })
      })
      .catch(error => {
        console.error(`ALE Mutations Error: Error occured while sending transaction`, error)

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
