import { AbiMapping } from '../AbiMapping'
import { AbiDefinition } from '../AbiDefinition'
import abi from './abi'

describe('AbiMapping', () => {
  const abiDef = new AbiDefinition(abi)

  describe('constructor()', () => {
    it('should not need arguments', () => {
      new AbiMapping()
    })
  })

  describe('addAbi()', () => {
    const mapping = new AbiMapping()

    it('should require non-null name', () => {
      expect(() => {
        mapping.addAbi(null, abiDef)
      }).toThrow()
    })

    it('should require non-null abi', () => {
      expect(() => {
        mapping.addAbi('hello', null)
      }).toThrow()
    })

    it('should add an abi', () => {
      mapping.addAbi('hello', abiDef)

      expect(mapping.getAbi('hello')).toEqual(abiDef)
    })
  })

  describe('addAddress()', () => {
    const mapping = new AbiMapping()

    it('should work', () => {
      mapping.addAddress('Vouching', '1234')

      expect(mapping.getAddress('Vouching')).toEqual('1234')
    })
  })
})
