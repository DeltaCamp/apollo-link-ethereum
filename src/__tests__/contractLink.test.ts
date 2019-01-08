import { execute } from 'apollo-link'
import gql from 'graphql-tag'
import { ContractLink } from '../ContractLink'
import { Web3Resolver } from '../Web3Resolver'

const sampleQuery = gql`
  query SampleQuery {
    CoordinationGame @contract(address: "0x1111") {
      id
      game
      verification
    }
    SomethingElse {
      id
      name
    }
    rename: TrueBit @contract(address: "0x9999") {
      trueBitId
      test(value: "123")
    }
  }
`

function createWeb3Resolver(impl): Web3Resolver {
  const mockResolve = jest.fn(impl);
  const web3Resolver:Web3Resolver = {
    resolve: mockResolve
  }
  return web3Resolver
}

describe('ContractLink', () => {
  it('should resolve the promises correctly', done => {
    const resolveData = 'resolveMockPromise'
    const web3Resolver:Web3Resolver = createWeb3Resolver(() => Promise.resolve(resolveData))
    const next = jest.fn();
    const contractLink = new ContractLink(web3Resolver)
    const observable = execute(contractLink, {
      query: sampleQuery,
    });
    observable.subscribe({
      next,
      error: error => expect(false),
      complete: () => {
        expect(next).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith({
          data: {
            CoordinationGame: {
              id: resolveData,
              game: resolveData,
              verification: resolveData
            },
            SomethingElse: {
              id: {},
              name: {}
            },
            rename: {
              trueBitId: resolveData,
              test: resolveData
            }
          },
          errors: undefined
        })
        done()
      },
    });
  })

  it('should correctly handle errors', done => {
    const resolveErrorMsg = 'resolveError'
    const web3Resolver:Web3Resolver = createWeb3Resolver(() => Promise.reject(resolveErrorMsg))
    const next = jest.fn();
    const contractLink = new ContractLink(web3Resolver)
    const observable = execute(contractLink, {
      query: sampleQuery,
    });
    observable.subscribe({
      next,
      error: error => expect(false),
      complete: () => {
        expect(next).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith({
          data: {
            CoordinationGame: {
              id: { error: resolveErrorMsg },
              game: { error: resolveErrorMsg },
              verification: { error: resolveErrorMsg }
            },
            SomethingElse: {
              id: {},
              name: {}
            },
            rename: {
              trueBitId: { error: resolveErrorMsg },
              test: { error: resolveErrorMsg }
            }
          },
          errors: undefined
        })
        done()
      },
    });
  })
})
