import { AbiMapping, Web3Resolver } from 'apollo-link-web3'

export class Web3JSResolver implements Web3Resolver {
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

  resolve (contractName, contractDirectives, fieldName, args = {}, info): Promise<any> {
    if (!this.web3) { return Promise.resolve() }
    const values = Object.values(args || {})
    console.log(`${fieldName} args: `, values)
    const contract = this._getContract(contractName, contractDirectives)
    const methodFactory = contract.methods[fieldName]
    if (typeof methodFactory !== 'function') {
      console.error('wtf mate?', contract, methodFactory)
      return Promise.resolve('nope')
    } else {
      const method = methodFactory()
      return method.call()
    }
  }

  _getContract (contractName, contractDirectives) {
    const { address } = contractDirectives
    if (!address) {
      throw new Error(`Address not present in query against abi ${contractName}`)
    }
    let contract = this.contractCache[address]
    if (!contract) {
      const abi = this.abiMapping.getAbi(contractName)
      if (!abi) {
        throw new Error(`Could not find abi for name ${contractName}`)
      }
      contract = new this.web3.eth.Contract(abi, address)
      this.contractCache[address] = contract
    }
    return contract
  }
}
