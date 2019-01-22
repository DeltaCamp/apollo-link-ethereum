import { execute, Observable, FetchResult } from 'apollo-link'
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
    const ethereumResolver:EthereumResolver = {
      resolve: mockResolve,
      subscribe: jest.fn()
    }
    const next = jest.fn()
    const contractLink = new ContractLink(ethereumResolver)
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
      resolve: mockResolve,
      subscribe: jest.fn()
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

  it('should handle subscriptions', (done) => {

    const sampleQuery = gql`
      subscription SampleQuery {
        CoordinationGame @contract(address: "0x1111") {
          allEvents @events
        }
      }
    `

    let callback = {
      cb: null
    }

    const web3Observable = new Observable<FetchResult>(observer => {

      if (!callback.cb) {
        callback.cb = function () {
          observer.next('New Event!!')
        }
      }

      return () => {}
    })
    web3Observable['blah'] = 'test obj'

    const ethereumResolver:EthereumResolver = {
      resolve: jest.fn(),
      subscribe: jest.fn(() => web3Observable)
    }

    const contractLink = new ContractLink(ethereumResolver)

    const observable = execute(contractLink, {
      query: sampleQuery,
    })

    const next = jest.fn()
    const error = jest.fn()

    observable.subscribe({
      next,
      error,
      complete: () => {

        callback.cb()

        expect(next).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith({
          data: {
            CoordinationGame: {
              allEvents: {
                result: 'New Event!!',
                error: null
              }
            }
          },
          errors: []
        })
        done()
      }
    })
  })
})
