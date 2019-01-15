import { AbiDefinition } from './AbiDefinition'

export class AbiMapping {
  abiMapping: object
  addressMapping: object

  constructor () {
    this.abiMapping = {}
    this.addressMapping = {}
  }

  addAbi(name: string, abiDefinition: AbiDefinition): void {
    if (!name) {
      throw new Error(`ABI cannot be mapped to a null name`)
    }
    if (!abiDefinition) {
      throw new Error(`ABI cannot be null`)
    }
    this.abiMapping[name] = abiDefinition
  }

  getAbi(name: string): AbiDefinition {
    return this.abiMapping[name]
  }

  addAddress(name: string, networkId: Number, address: string) {
    if (!this.addressMapping[name]) {
      this.addressMapping[name] = {}
    }
    this.addressMapping[name][networkId] = address
  }

  getAddress(name: string, networkId: Number) {
    if (!this.addressMapping[name]) {
      return null
    }
    return this.addressMapping[name][networkId]
  }
}
