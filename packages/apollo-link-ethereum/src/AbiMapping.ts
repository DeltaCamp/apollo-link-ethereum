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

  addAddress(name: string, address: string) {
    this.addressMapping[name] = address
  }

  getAddress(name: string) {
    return this.addressMapping[name]
  }
}
