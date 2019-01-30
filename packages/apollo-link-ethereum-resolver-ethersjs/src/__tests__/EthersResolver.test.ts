import { EthersResolver } from '../EthersResolver'
import { ethers as ethersJs } from 'ethers'
import { AbiMapping, AbiDefinition } from 'apollo-link-ethereum'
import abi from './abi'

jest.mock('ethers')

const { ethers, assign } = require('ethers')

describe('EthersResolver', () => {
  let abiMapping, resolver, ethersProvider

  let balanceOf

  beforeEach(() => {
    balanceOf = jest.fn(() => Promise.resolve())
    let Contract = jest.fn().mockImplementation(() => ({
      address: '0x1234',
      filters: {
        TestEvent: jest.fn(() => ({ topics: [9999] }))
      },
      balanceOf
    }))
    assign({
      Contract,
      utils: {
        Interface: jest.fn().mockImplementation(() => ({
          parseLog: jest.fn(() => 'ParsedLoggg')
        })),
        defaultAbiCoder: {
          encode: jest.fn(() => '0x0000000000000000000000000000000e')
        }
      }
    })

    abiMapping = new AbiMapping()
    abiMapping.addAbi('TheContract', new AbiDefinition(abi))
    abiMapping.addAddress('TheContract', 1234, '0x1234')

    ethersProvider = {
      getNetwork: jest.fn(() => Promise.resolve({ chainId: 1234 })),
      getLogs: jest.fn(() => Promise.resolve([1, 2, 3])),
      on: jest.fn()
    }

    resolver = new EthersResolver(abiMapping, ethersProvider)
  })

  describe('resolve()', () => {
    describe('@pastEvents', () => {
      it('should return all events', async () => {
        await resolver.resolve(
          'TheContract', {}, 'allEvents', {}, { pastEvents: null }
        )

        expect(ethersProvider.getLogs).toHaveBeenCalledTimes(1)
        expect(ethersProvider.getLogs).toHaveBeenCalledWith({
          address: '0x1234',
          fromBlock: 0,
          toBlock: 'latest',
          topics: [null]
        })
      })

      it('should return add extra topics to allEvents', async () => {
        await resolver.resolve(
          'TheContract', {}, 'allEvents', {}, { pastEvents: { extraTopics: { types: ['uint256'], values: [14] } } }
        )

        let xTopic = "0x0000000000000000000000000000000e"

        expect(ethersProvider.getLogs).toHaveBeenCalledTimes(1)
        expect(ethersProvider.getLogs).toHaveBeenCalledWith({
          address: '0x1234',
          fromBlock: 0,
          toBlock: 'latest',
          topics: [null, xTopic]
        })
      })

      it('should return certain events', async () => {
        await resolver.resolve(
          'TheContract', {}, 'TestEvent', {}, { pastEvents: { toBlock: '5555' } }
        )

        expect(ethersProvider.getLogs).toHaveBeenCalledTimes(1)
        expect(ethersProvider.getLogs).toHaveBeenCalledWith({
          address: '0x1234',
          fromBlock: 0,
          toBlock: '5555',
          topics: [9999]
        })
      })

      it('should add extra topics to event topics', async () => {
        await resolver.resolve(
          'TheContract', {}, 'TestEvent', {}, { pastEvents: { toBlock: '5555', extraTopics: { types: ['uint256'], values: [14] } } }
        )

        let xTopic = "0x0000000000000000000000000000000e"

        expect(ethersProvider.getLogs).toHaveBeenCalledTimes(1)
        expect(ethersProvider.getLogs).toHaveBeenCalledWith({
          address: '0x1234',
          fromBlock: 0,
          toBlock: '5555',
          topics: [9999, xTopic]
        })
      })
    })

    describe('@call', () => {
      it('should call by default', async () => {
        await resolver.resolve(
          'TheContract', {}, 'balanceOf', { address: '0x8888' }, {}
        )

        expect(balanceOf).toHaveBeenCalledWith('0x8888')
      })

      it('should call with options', async () => {
        await resolver.resolve(
          'TheContract', {}, 'balanceOf', { address: '0x8888' }, { call: { value: 1 } }
        )

        expect(balanceOf).toHaveBeenCalledWith('0x8888', { value: 1 })
      })
    })
  })

  describe('@block', () => {
    it('should subscribe to blocks', async () => {
      const observable = await resolver.subscribe(null, {}, 'blockAlias', {}, { block: null })

      observable.subscribe({
        next: jest.fn()
      })

      expect(ethersProvider.on).toHaveBeenCalledTimes(1)
    })
  })
})