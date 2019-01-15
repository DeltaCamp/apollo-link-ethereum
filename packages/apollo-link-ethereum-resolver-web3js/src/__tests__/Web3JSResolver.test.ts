import { Web3JSResolver } from '../Web3JSResolver'
import { AbiMapping, AbiDefinition } from 'apollo-link-ethereum'
import abi from './abi'

let id = 0

describe('Web3JSResolver', () => {
  let methodNameSend, getPastEvents, web3, abiMapping, abiDef

  beforeEach(() => {
    methodNameSend = jest.fn()
    getPastEvents = jest.fn()
    web3 = {
      eth: {
        net: {
          getId: jest.fn(() => Promise.resolve(1234))
        },
        Contract: jest.fn().mockImplementation(() => ({
          id: id++,
          methods: {
            methodName: jest.fn(() => ({
              call: methodNameSend
            }))
          },
          getPastEvents
        }))
      }
    }
    abiMapping = new AbiMapping()
    abiDef = new AbiDefinition(abi)
    abiMapping.addAbi('TheContract', abiDef)
  })

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
      it('should find the web3 method and call it', async () => {
        await resolver.resolve('TheContract', { address: '0x1234' }, 'methodName', { foo: 'bar' }, { call: { gas: 1000 } })
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
        it('should use the abi address', async () => {
          abiMapping.addAddress('TheContract', 1234, '0x1234')
          await resolver.resolve('TheContract', {}, 'methodName', { foo: 'bar' }, { call: { gas: 1000 } })
          expect(methodNameSend).toHaveBeenCalledTimes(1)
          expect(methodNameSend).toHaveBeenCalledWith({ gas: 1000 })
        })
      })
    })

    describe('@pastEvents', () => {
      it('should get all past events for the contract', async () => {
        await resolver.resolve('TheContract', { address: '0x1234' }, 'EventName', { foo: 'bar' }, { pastEvents: { fromBlock: 0 } })
        expect(getPastEvents).toHaveBeenCalledWith('EventName', { fromBlock: 0 })
      })
    })
  })
})
