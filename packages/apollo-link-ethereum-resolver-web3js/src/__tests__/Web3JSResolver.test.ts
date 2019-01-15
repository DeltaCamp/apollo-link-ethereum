import { Web3JSResolver } from '../Web3JSResolver'
import { AbiMapping, AbiDefinition } from 'apollo-link-ethereum'
import abi from './abi'

describe('Web3JSResolver', () => {
  const methodNameSend = jest.fn()
  const getPastEvents = jest.fn()
  const web3 = {
    eth: {
      Contract: jest.fn().mockImplementation(() => ({
        methods: {
          methodName: jest.fn(() => ({
            call: methodNameSend
          }))
        },
        getPastEvents
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

  describe('directives', () => {
    let resolver

    beforeEach(() => {
      resolver = new Web3JSResolver(abiMapping, web3)
    })

    describe('@call', () => {
      it('should find the web3 method and call it', () => {
        resolver.resolve('TheContract', { address: '0x1234' }, 'methodName', { foo: 'bar' }, { call: { gas: 1000 } })
        expect(methodNameSend).toHaveBeenCalledTimes(1)
        expect(methodNameSend).toHaveBeenCalledWith({ gas: 1000 })
      })

      it('should error when no address is present', () => {
        return new Promise((resolve, reject) => {
          resolver.resolve('TheContract2', {}, 'methodName', { foo: 'bar' }, { call: { gas: 1000 } })
            .then(() => {
              reject('An error should have been thrown')
            })
            .catch(() => {
              resolve('ok!')
            })
        })
      })

      describe('when the abi has an address mapping', () => {
        it('should use the abi address', () => {
          abiMapping.addAddress('TheContract2', '0x1234')
          resolver.resolve('TheContract2', {}, 'methodName', { foo: 'bar' }, { call: { gas: 1000 } })
          expect(methodNameSend).toHaveBeenCalledTimes(1)
          expect(methodNameSend).toHaveBeenCalledWith({ gas: 1000 })
        })
      })
    })

    describe('@pastEvents', () => {
      it('should get all past events for the contract', () => {
        resolver.resolve('TheContract', { address: '0x1234' }, 'EventName', { foo: 'bar' }, { pastEvents: { fromBlock: 0 } })
        expect(getPastEvents).toHaveBeenCalledWith('EventName', { fromBlock: 0 })
      })
    })
  })
})
