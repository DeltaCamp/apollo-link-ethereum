import { AbiDefinition } from '../AbiDefinition'
import abi from './abi'

describe('AbiDefinition', () => {
  describe('constructor()', () => {
    it('Should require an abi', () => {
      expect(() => new AbiDefinition(null)).toThrow()
    })

    it('should accept an abi', () => {
      const abiDef = new AbiDefinition(abi)
    })
  })

  describe('findByName', () => {
    it('should correctly lookup a def', () => {
      const abiDef = new AbiDefinition(abi)
      expect(abiDef.findByName('Transfer')).toEqual(
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "name": "from",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "value",
              "type": "uint256"
            }
          ],
          "name": "Transfer",
          "type": "event"
        }
      )
    })
  })
})
