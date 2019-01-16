import { AbiMapping, EthereumResolver } from 'apollo-link-ethereum'

export class Web3JSResolver implements EthereumResolver {
  web3: any
  abiMapping: AbiMapping
  contractCache: {}

  constructor (abiMapping: AbiMapping, web3?: any) {
    if (!abiMapping) {
      throw new Error('abiMapping must be defined')
    }
    this.web3 = web3
    this.abiMapping = abiMapping
    this.contractCache = {}
  }

  async resolve (contractName, contractDirectives, fieldName, fieldArgs, fieldDirectives): Promise<any> {
    try {
      fieldDirectives = fieldDirectives || {}
      fieldArgs = fieldArgs || {}
      if (!this.web3) { return Promise.resolve() }
      const contract = await this._getContract(contractName, contractDirectives)
      let result = null
      if (fieldDirectives.hasOwnProperty('pastEvents')) {
        result = this._pastEvents(contract, fieldName, fieldArgs, fieldDirectives)
      } else {
        result = this._call(contract, fieldName, fieldArgs, fieldDirectives)
      }
      return result
    } catch (error) {
      console.error(error)
      return Promise.reject(error.toString())
    }
  }

  _call (contract, fieldName, fieldArgs, fieldDirectives): Promise<any> {
    const values = Object.keys(fieldArgs || {}).map(key => fieldArgs[key]);
    const methodFactory = contract.methods[fieldName]
    if (typeof methodFactory !== 'function') {
      return Promise.reject(`Unknown function ${fieldName}`)
    } else {
      const method = methodFactory(...values)
      const options = fieldDirectives ? fieldDirectives.call : {}
      return method.call(options)
    }
  }

  _pastEvents (contract, fieldName, fieldArgs, fieldDirectives): Promise<any> {
    return contract.getPastEvents(fieldName, fieldDirectives ? fieldDirectives.pastEvents : {})
  }

  async _getContract (contractName, contractDirectives) {
    const networkId = await this.web3.eth.net.getId()
    if (!this.contractCache[networkId]) {
      this.contractCache[networkId] = {}
    }

    let address = contractDirectives ? contractDirectives.address : null
    if (!address) {
      address = this.abiMapping.getAddress(contractName, networkId)
    }
    if (!address) {
      throw new Error(`Address not present in query against abi ${contractName}`)
    }
    let contract = this.contractCache[networkId][address]
    if (!contract) {
      const abi = this.abiMapping.getAbi(contractName)
      if (!abi) {
        throw new Error(`Could not find abi for name ${contractName}`)
      }
      contract = new this.web3.eth.Contract(abi, address)
      this.contractCache[networkId][address] = contract
    }
    return contract
  }
}
