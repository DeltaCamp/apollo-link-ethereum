import { AbiMapping, Web3Resolver } from 'apollo-link-web3'

export class Web3JSResolver implements Web3Resolver {
  web3: any
  abiMapping: AbiMapping
  contractCache: {}

  constructor (web3: any, abiMapping: AbiMapping) {
    if (!web3) {
      throw new Error('web3 must be defined')
    }
    if (!abiMapping) {
      throw new Error('abiMapping must be defined')
    }
    this.web3 = web3
    this.abiMapping = abiMapping
    this.contractCache = {}
  }

  resolve (contractName, contractDirectives, fieldName, args, info): Promise<any> {
    const contract = this._getContract(contractName, contractDirectives)
    return contract.methods[fieldName](args)(info)
  }

  _getContract (contractName, contractDirectives) {
    const { address } = contractDirectives
    if (!address) {
      throw new Error(`Address not configured for contract ${contractName}`)
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
