import { ethers } from 'ethers'
import { Observable, FetchResult } from 'apollo-link'
import { AbiMapping, EthereumResolver } from 'apollo-link-ethereum'

const debug = require('debug')('apollo-link-ethereum-resolver-ethersjs:EthersResolver')
const subscriptionDebug = require('debug')('apollo-link-ethereum-resolver-ethersjs:EthersResolver:subscription')

class EthersResolverOptions {
  abiMapping: AbiMapping
  provider: any
  defaultFromBlock?: any
  defaultToBlock?: any
}

export class EthersResolver implements EthereumResolver {
  provider: any
  abiMapping: AbiMapping
  defaultFromBlock?: any
  defaultToBlock?: any
  contractCache: {}
  ifaceCache: {}

  constructor (options: EthersResolverOptions) {
    if (!options.abiMapping) {
      throw new Error('abiMapping must be defined')
    }
    if (!options.provider) {
      throw new Error('provider must be defined')
    }
    this.provider = options.provider
    this.abiMapping = options.abiMapping
    this.defaultFromBlock = options.defaultFromBlock || 0
    this.defaultToBlock = options.defaultToBlock || 'latest'
    this.contractCache = {}
    this.ifaceCache = {}
  }

  async actualProvider() {
    if (typeof this.provider ===  'function') {
      return await this.provider()
    } else if (this.provider) {
      return this.provider
    } else {
      throw new Error("provider is not defined")
    }
  }

  async resolve (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Promise<any> {
    debug(`resolve(${contractName}#${fieldName})`)
    try {
      fieldDirectives = fieldDirectives || {}
      fieldArgs = fieldArgs || {}
      if (fieldDirectives.hasOwnProperty('pastEvents')) {
        return this._getPastEvents(contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives)
      } else {
        return this._call(contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives)
      }
    } catch (error) {
      console.error(`${contractName}.${fieldName}(${JSON.stringify(fieldArgs)}): `, error.message)
      return Promise.reject(error.toString())
    }
  }

  subscribe (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Observable<FetchResult> {
    subscriptionDebug(`subscribe(${contractName}#${fieldName})`)
    if (fieldDirectives && fieldDirectives.hasOwnProperty('events')) {
      return this._subscribeEvents(contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives)
    } if (fieldDirectives && fieldDirectives.hasOwnProperty('block')) {
      return this._subscribeBlock(contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives)
    } else {
      const errorMessage = `${contractName}.${fieldName}(${JSON.stringify(fieldArgs)}): Unknown directives: ${JSON.stringify(fieldDirectives)}`
      console.error(errorMessage)
      return new Observable<FetchResult>(observer => {
        observer.error(errorMessage)
      })
    }
  }

  _subscribeEvents (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Observable<FetchResult> {
    return new Observable<FetchResult>(observer => {
      this.actualProvider()
        .then(provider => {
          this._getContract(contractName, contractDirectives)
            .then(contract => {
              let options = fieldDirectives ? fieldDirectives.events : {}
              const filter = this._getFieldNameFilter(contract, contractName, fieldName, fieldArgs, options)
              subscriptionDebug(`Setup filter: `, filter)
              provider.on(filter, (log) => {
                const iface = this._getInterface(contractName)
                const event = {
                  log,
                  parsedLog: iface.parseLog(log)
                }
                subscriptionDebug(`filter ${contractName}.${fieldName} received `, filter, event)
                observer.next(event)
              })
            })
            .catch(error => {
              console.error(`${contractName}.${fieldName}(${JSON.stringify(fieldArgs)}): `, error.message)
              observer.error(error)
            })
        })
    })
  }

  _subscribeBlock (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Observable<FetchResult> {
    return new Observable<FetchResult>(observer => {
      this.actualProvider()
        .then(provider => {
          provider.on('block', (block) => {
            observer.next(block)
          })
        })
        .catch(error => observer.error(error))
    })
  }

  async _getPastEvents (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives) {
    const contract = await this._getContract(contractName, contractDirectives)
    let options = fieldDirectives ? fieldDirectives.pastEvents : {}
    debug(`getPastEvents(${contractName}#${fieldName}`)
    let filter = this._getFieldNameFilter(contract, contractName, fieldName, fieldArgs, options)
    const iface = this._getInterface(contractName)
    const provider = await this.actualProvider()
    return provider.getLogs(filter)
      .then(logs => {
        return logs.map(log => ({
          log,
          parsedLog: iface.parseLog(log)
        }))
      })
  }

  _getFieldNameFilter(contract, contractName, fieldName, fieldArgs, options): any {
    options = options || {}
    var extraTopicIndex = 0

    let topics
    if (fieldName === 'allEvents') {
      subscriptionDebug(`using empty topics for ${contractName}.${fieldName}`)
      topics = [null]
    } else {
      let values = Object.keys(fieldArgs || {}).map(key => fieldArgs[key]);
      let fxnFilter = contract.filters[fieldName]
      if (!fxnFilter) { throw new Error(`${contractName} does not have an event called ${fieldName}`)}
      debug('getFieldNameFilter fxnFilter values: ', values, ' for args: ', fieldArgs)
      topics = fxnFilter(...values).topics
      subscriptionDebug(`using topics for ${contractName}.${fieldName}`, topics)
    }
    debug('getFieldNameFilter topics: ', topics)

    let extraTopics = options.extraTopics ? options.extraTopics : {}
    let extraTopicTypes = extraTopics.types || []
    let extraTopicValues = extraTopics.values || []

    let encodedExtraTopics = []
    if (extraTopicTypes.length !== extraTopicValues.length) {
      throw new Error(`${contractName} events ${fieldName}: extraTopics must have same number of types and values`)
    }

    for (extraTopicIndex = 0; extraTopicIndex < extraTopicTypes.length; extraTopicIndex++) {
      const type = extraTopicTypes[extraTopicIndex]
      const value = extraTopicValues[extraTopicIndex]
      let encodedValue = null
      if (value) {
        encodedValue = ethers.utils.defaultAbiCoder.encode([type], [value])
      }
      encodedExtraTopics.push(encodedValue)
    }

    const filter = {
      address: options.address || contract.address,
      fromBlock: options.fromBlock ? this._parseBlockNumber(options.fromBlock) : this.defaultFromBlock,
      toBlock: options.toBlock ? this._parseBlockNumber(options.toBlock) : this.defaultToBlock,
      topics: options.topics ? options.topics.concat(extraTopics) : topics.concat(encodedExtraTopics)
    }

    debug(`getFieldNameFilter(${contract}, ${contractName}, ${fieldName}: `, filter)

    return filter
  }

  _parseBlockNumber (integerString) {
    if (isNaN(integerString)) {
      return integerString
    } else {
      return parseInt(integerString, 10)
    }
  }

  async _call (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Promise<any> {
    const contract = await this._getContract(contractName, contractDirectives)
    let values = Object.keys(fieldArgs || {}).map(key => fieldArgs[key]);
    const method = contract.interface.functions[fieldName]
    if (!method) {
      return Promise.reject(`Unknown function ${fieldName}`)
    } else {
      try {
        debug(fieldName)
        const data = method.encode(values)

        const tx = {
          data,
          to: contract.address
        }

        const provider = await this.actualProvider()

        return provider.call(tx).then(function (value) {
          let returns = method.decode(value)
          if (method.outputs.length === 1) {
              returns = returns[0];
          }
          if (Array.isArray(returns)) {
            returns = Object.assign({}, returns)
          }
          return returns
        })
      } catch (error) {
        console.error(`${contractName}.${fieldName}(${JSON.stringify(fieldArgs)}): `, error.message)
        throw error
      }
    }
  }

  async _getContract (contractName, contractDirectives) {
    const provider = await this.actualProvider()
    const network = await provider.getNetwork()
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
      contract = new ethers.Contract(address, abi, provider)
      this.contractCache[chainId][address] = contract
    }
    return contract
  }

  _getInterface (contractName) {
    let iface = this.ifaceCache[contractName]
    if (!iface) {
      const abi: any = this.abiMapping.getAbi(contractName)
      if (!abi) {
        throw new Error(`Could not find abi for name ${contractName}`)
      }
      iface = new ethers.utils.Interface(abi)
      this.ifaceCache[contractName] = iface
    }
    debug(`getInterface(${contractName}): `, iface)
    return iface
  }
}
