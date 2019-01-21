import { AbiDefinition } from './AbiDefinition'

export class AbiMapping {
  abiMapping: object
  nameToAddressMapping: object
  addressToNameMapping: object

  constructor () {
    this.abiMapping = {}
    this.nameToAddressMapping = {}
    this.addressToNameMapping = {}
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
    if (!this.nameToAddressMapping[name]) {
      this.nameToAddressMapping[name] = {}
    }
    if (!this.addressToNameMapping[address]) {
      this.addressToNameMapping[address] = {}
    }
    this.nameToAddressMapping[name][networkId] = address
    this.addressToNameMapping[address][networkId] = name
  }

  getAddress(name: string, networkId: Number) {
    if (!this.nameToAddressMapping[name]) {
      return undefined
    }
    return this.nameToAddressMapping[name][networkId]
  }

  getName(address: string, networkId: Number) {
    if (!this.addressToNameMapping[address]) {
      return undefined
    }
    return this.addressToNameMapping[address][networkId]
  }
}
