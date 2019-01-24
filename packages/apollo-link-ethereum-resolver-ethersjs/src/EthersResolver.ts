import { ethers } from 'ethers'
import { Observable, FetchResult } from 'apollo-link'
import { AbiMapping, EthereumResolver } from 'apollo-link-ethereum'

export class EthersResolver implements EthereumResolver {
  ethers: any
  abiMapping: AbiMapping
  contractCache: {}

  constructor (abiMapping: AbiMapping, ethers?: any) {
    if (!abiMapping) {
      throw new Error('abiMapping must be defined')
    }
    this.ethers = ethers
    this.abiMapping = abiMapping
    this.contractCache = {}
  }

  async resolve (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Promise<any> {
    try {
      fieldDirectives = fieldDirectives || {}
      fieldArgs = fieldArgs || {}
      if (!this.ethers) { return Promise.resolve() }
      if (fieldDirectives.hasOwnProperty('pastEvents')) {
        return this._getPastEvents(contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives)
      } else {
        return this._call(contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives)
      }
    } catch (error) {
      console.error(error)
      return Promise.reject(error.toString())
    }
  }

  subscribe (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Observable<FetchResult> {
    if (fieldDirectives.hasOwnProperty('events')) {
      return this._subscribeEvents(contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives)
    }
  }

  _subscribeEvents (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Observable<FetchResult> {
    return new Observable<FetchResult>(observer => {
      this._getContract(contractName, contractDirectives)
        .then(contract => {
          const filter = this._getFieldNameFilter(contract, contractName, fieldName)
          contract.on(filter, (event) => {
            observer.next(event)
          })
        })
    })
  }

  async _getPastEvents (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives) {
    const contract = await this._getContract(contractName, contractDirectives)
    let options = fieldDirectives ? fieldDirectives.pastEvents : {}
    let filter = Object.assign(this._getFieldNameFilter(contract, contractName, fieldName), options)
    return this.ethers.getLogs(filter)
  }

  _getFieldNameFilter(contract, contractName, fieldName): any {
    let topics = []
    if (fieldName !== 'allEvents') {
      let filter = contract.filters[fieldName]
      if (!filter) { throw new Error(`${contractName} does not have an event called ${fieldName}`)}
      topics = filter().topics
    }

    return {
      address: contract.address,
      fromBlock: '0',
      toBlock: 'latest',
      topics
    }
  }

  async _call (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Promise<any> {
    const contract = await this._getContract(contractName, contractDirectives)
    let values = Object.keys(fieldArgs || {}).map(key => fieldArgs[key]);
    if (typeof contract[fieldName] !== 'function') {
      return Promise.reject(`Unknown function ${fieldName}`)
    } else {
      const options = fieldDirectives ? fieldDirectives.call : null
      if (options) {
        values = values.concat([options])
      }
      return contract[fieldName](...values)
    }
  }

  async _getContract (contractName, contractDirectives) {
    const network = await this.ethers.getNetwork()
    const { chainId } = network

    if (!this.contractCache[chainId]) {
      this.contractCache[chainId] = {}
    }

    let address = contractDirectives ? contractDirectives.address : null
    if (!address) {
      address = this.abiMapping.getAddress(contractName, chainId)
    }
    if (!address) {
      throw new Error(`Address not present in query against abi ${contractName}`)
    }
    let contract = this.contractCache[chainId][address]
    if (!contract) {
      const abi: any = this.abiMapping.getAbi(contractName)
      if (!abi) {
        throw new Error(`Could not find abi for name ${contractName}`)
      }
      contract = new ethers.Contract(address, abi, this.ethers)
      this.contractCache[chainId][address] = contract
    }
    return contract
  }
}
