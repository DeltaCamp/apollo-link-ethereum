export class AbiDefinition {
  nameLookup: object
  abi: Array<any>

  constructor (abi: Array<any>) {
    if (!abi) { throw new Error('abi is undefined') }
    this.abi = abi
    this.nameLookup = {}
    this.abi.forEach(def => {
      this.nameLookup[def.name] = def
    })
  }

  findByName (name: string): object {
    return this.nameLookup[name]
  }
}
