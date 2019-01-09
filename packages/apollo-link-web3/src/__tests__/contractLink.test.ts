import { execute } from 'apollo-link'
import gql from 'graphql-tag'
import { ContractLink } from '../ContractLink'
import { Web3Resolver } from '../Web3Resolver'

describe('ContractLink', () => {
  it('should resolve the promises correctly', done => {

    const sampleQuery = gql`
      query SampleQuery {
        CoordinationGame @contract(address: "0x1111") {
          game(blah: "test") @options(foo: "bar")
        }
      }
    `

    const resolveData = 'resolveMockPromise'
    const mockResolve = jest.fn(() => Promise.resolve(resolveData))
    const web3Resolver:Web3Resolver = {
      resolve: mockResolve
    }
    const next = jest.fn()
    const contractLink = new ContractLink(web3Resolver)
    const observable = execute(contractLink, {
      query: sampleQuery,
    })
    observable.subscribe({
      next,
      error: error => expect(false),
      complete: () => {

        expect(mockResolve).toHaveBeenCalledWith(
          'CoordinationGame', { address: '0x1111' }, 'game', { blah: "test" }, { options: { foo: "bar" } }
        )

        expect(next).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith({
          data: {
            CoordinationGame: {
              game: resolveData,
            }
          },
          errors: undefined
        })

        done()
      },
    })
  })

  it('should correctly handle errors', done => {

    const sampleQuery = gql`
      query SampleQuery {
        CoordinationGame @contract(address: "0x1111") {
          game(blah: "test") @options(foo: "bar")
        }
      }
    `

    const resolveErrorMsg = 'resolveError'
    const mockResolve = jest.fn(() => Promise.reject(resolveErrorMsg))
    const web3Resolver:Web3Resolver = {
      resolve: mockResolve
    }
    const next = jest.fn()
    const contractLink = new ContractLink(web3Resolver)
    const observable = execute(contractLink, {
      query: sampleQuery,
    })
    observable.subscribe({
      next,
      error: error => expect(false),
      complete: () => {
        expect(next).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith({
          data: {
            CoordinationGame: {
              game: { error: resolveErrorMsg },
            }
          },
          errors: undefined
        })
        done()
      },
    })
  })
})
