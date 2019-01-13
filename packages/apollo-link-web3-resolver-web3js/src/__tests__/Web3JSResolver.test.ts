import { Web3JSResolver } from '../Web3JSResolver'
import { AbiMapping, AbiDefinition } from 'apollo-link-web3'
import abi from './abi'

describe('Web3JSResolver', () => {
  const methodNameSend = jest.fn()
  const web3 = {
    eth: {
      Contract: jest.fn().mockImplementation(() => ({
        methods: {
          methodName: jest.fn(() => methodNameSend)
        }
      }))
    }
  }
  const abiMapping = new AbiMapping()
  const abiDef = new AbiDefinition(abi)
  abiMapping.addAbi('TheContract', abiDef)

  describe('constructor()', () => {
    it('should require args', () => {
      expect(() => new Web3JSResolver(null)).toThrow()
    })

    it('should set the abiMapping and web3', () => {
      const resolver = new Web3JSResolver(abiMapping, web3)
      expect(resolver.web3).toEqual(web3)
      expect(resolver.abiMapping).toEqual(abiMapping)
    })
  })

  describe('resolve', () => {
    let resolver

    beforeEach(() => {
      resolver = new Web3JSResolver(abiMapping, web3)
    })

    it('should find the web3 method and call it', () => {
      resolver.resolve('TheContract', { address: '0x1234' }, 'methodName', { foo: 'bar' }, { options: { gas: 1000 } })
      expect(methodNameSend).toHaveBeenCalledTimes(1)
      expect(methodNameSend).toHaveBeenCalledWith({ options: { gas: 1000 } })
    })
  })
})
