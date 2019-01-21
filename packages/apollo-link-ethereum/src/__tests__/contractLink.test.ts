import { execute } from 'apollo-link'
import gql from 'graphql-tag'
import { ContractLink } from '../ContractLink'
import { EthereumResolver } from '../EthereumResolver'

describe('ContractLink', () => {
  it('should resolve the promises correctly', done => {

    const sampleQuery = gql`
      query SampleQuery {
        CoordinationGame @contract {
          game(blah: "test") @options(foo: "bar")
        }
      }
    `

    const resolveData = 'resolveMockPromise'
    const mockResolve = jest.fn(() => Promise.resolve(resolveData))
    const EthereumResolver:EthereumResolver = {
      resolve: mockResolve
    }
    const next = jest.fn()
    const contractLink = new ContractLink(EthereumResolver)
    const observable = execute(contractLink, {
      query: sampleQuery,
    })
    observable.subscribe({
      next,
      error: error => expect(false),
      complete: () => {

        expect(mockResolve).toHaveBeenCalledWith(
          'CoordinationGame', null, 'game', { blah: "test" }, { options: { foo: "bar" } }
        )

        expect(next).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith({
          data: {
            CoordinationGame: {
              game: resolveData,
            }
          },
          errors: []
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
    const EthereumResolver:EthereumResolver = {
      resolve: mockResolve
    }
    const next = jest.fn()
    const errorHandler = jest.fn()
    const contractLink = new ContractLink(EthereumResolver)
    const observable = execute(contractLink, {
      query: sampleQuery,
    })
    observable.subscribe({
      next,
      error: errorHandler,
      complete: () => {
        expect(mockResolve).toHaveBeenCalledWith(
          'CoordinationGame', { address: '0x1111' }, 'game', { blah: "test" }, { options: { foo: "bar" } }
        )
        expect(next).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith({
          data: {
            CoordinationGame: {
              game: null,
            }
          },
          errors: [  'resolveError'  ]
        })
        done()
      },
    })
  })
})
