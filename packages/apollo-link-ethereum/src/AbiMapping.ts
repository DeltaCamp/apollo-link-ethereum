import { AbiDefinition } from './AbiDefinition'

export class AbiMapping {
  mapping: object

  constructor () {
    this.mapping = {}
  }

  addAbi(name: string, abiDefinition: AbiDefinition): void {
    if (!name) {
      throw new Error(`ABI cannot be mapped to a null name`)
    }
    if (!abiDefinition) {
      throw new Error(`ABI cannot be null`)
    }
    this.mapping[name] = abiDefinition
  }

  getAbi(name: string): AbiDefinition {
    return this.mapping[name]
  }
}
