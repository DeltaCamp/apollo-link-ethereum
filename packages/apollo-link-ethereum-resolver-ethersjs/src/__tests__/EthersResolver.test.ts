import { EthersResolver } from '../EthersResolver'
import { ethers as ethersJs } from 'ethers'
import { AbiMapping, AbiDefinition } from 'apollo-link-ethereum'
import abi from './abi'

jest.mock('ethers')

const { ethers, assign } = require('ethers')

describe('EthersResolver', () => {
  let abiMapping, resolver, ethersProvider

  let balanceOf

  let onCallbackPromise

  let balanceOfResponse:any = '1234'

  beforeEach(() => {
    balanceOf = jest.fn(() => Promise.resolve(balanceOfResponse))
    let onMock
    onCallbackPromise = new Promise((resolve, reject) => {
      onMock = jest.fn((filter, cb) => {
        resolve(cb)
      })
    })
    let Contract = jest.fn().mockImplementation(() => ({
      address: '0x1234',
      filters: {
        TestEvent: jest.fn(() => ({ topics: [9999] }))
      },
      on: onMock,
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

    resolver = new EthersResolver({
      abiMapping, provider: ethersProvider
    })
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


      it('should return add extra topics to allEvents', async () => {
        await resolver.resolve(
          'TheContract', {}, 'allEvents', {}, { pastEvents: { extraTopics: { types: ['address', 'uint256'], values: [null, 14] } } }
        )

        let xTopic = "0x0000000000000000000000000000000e"

        expect(ethersProvider.getLogs).toHaveBeenCalledTimes(1)
        expect(ethersProvider.getLogs).toHaveBeenCalledWith({
          address: '0x1234',
          fromBlock: 0,
          toBlock: 'latest',
          topics: [null, null, xTopic]
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
        const response = await resolver.resolve(
          'TheContract', {}, 'balanceOf', { address: '0x8888' }, {}
        )

        expect(balanceOf).toHaveBeenCalledWith('0x8888')
        expect(response).toEqual('1234')
      })

      it('should call with options', async () => {
        const response = await resolver.resolve(
          'TheContract', {}, 'balanceOf', { address: '0x8888' }, { call: { value: 1 } }
        )

        expect(balanceOf).toHaveBeenCalledWith('0x8888', { value: 1 })
        expect(response).toEqual('1234')
      })

      describe('with array arg return', () => {

        beforeEach(() => {
          balanceOfResponse = [
            'foo', 'bar'
          ]

          balanceOfResponse.result1 = 'foo'
          balanceOfResponse.result2 = 'bar'
        })

        it('should shape the return values as an object when an array', async () => {
          const response = await resolver.resolve(
            'TheContract', {}, 'balanceOf', { address: '0x8888' }, {}
          )

          expect(response).toEqual({
            0: 'foo',
            1: 'bar',
            result1: 'foo',
            result2: 'bar'
          })
        })
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

  describe('@events', () => {
    it('should subscribe to events', async () => {
      const observable = await resolver.subscribe('TheContract', {}, 'allEvents', {}, { events: null })

      let nextFxn = jest.fn()

      observable.subscribe({
        next: nextFxn,
        error: (err) => {
          console.error(err)
        }
      })

      let event = { block: 1234 }

      const onCallback = await onCallbackPromise

      onCallback('arg1', 'arg2', 'arg3', event)

      expect(nextFxn).toHaveBeenCalledWith({
        args: ['arg1', 'arg2', 'arg3'],
        event
      })
    })
  })
})
