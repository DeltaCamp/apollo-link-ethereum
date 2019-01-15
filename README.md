# Apollo Ethereum Link

The `apollo-link-ethereum` package allows you to use GraphQL to speak directly to a smart contract on the Ethereum blockchain.

The package integrates with [Apollo Client](https://www.apollographql.com) as a "link".  It is organized into separate packages to allow for different client bindings (i.e. web3js, ethers.js, ethjs)

| Package | Description |
| --- | --- |
| [apollo-link-ethereum](./packages/apollo-link-ethereum/README.md) | The main package |
| [apollo-link-ethereum-resolver-web3js](./packages/apollo-link-ethereum-resolver-web3js) | A package that provides a Web3js 1.0 binding |

Check out the example app [apollo-link-ethereum-example](https://github.com/DeltaCamp/apollo-link-ethereum-example)

## Install

We use yarn and lerna. Run yarn to install the lerna dependency:

`$ yarn`

Then use lerna to set up the child packages:

`$ lerna bootstrap`

Create symlinks for the two child packages on your filesystem using yarn link:

`$ cd packages/apollo-link-ethereum && yarn link && cd ../.. && cd packages/apollo-link-ethereum-resolver-web3js && yarn link`

Now in your project you can run:

`$ yarn link apollo-link-ethereum`

`$ yarn link apollo-link-ethereum-resolver-web3js`

The local versions on your filesystem will be available to your project.

## Usage

Setup a new Apollo Client:

```javascript
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ContractLink } from 'apollo-link-ethereum'
import { Web3JSResolver } from 'apollo-link-ethereum-resolver-web3js'
import { abiMapping } from './abiMapping'
import Web3 from 'web3'

const web3Resolver = new Web3JSResolver(abiMapping)
const contractLink = new ContractLink(web3Resolver)

const cache = new InMemoryCache({
  addTypename: false
})

export const apolloClient = new ApolloClient({
  cache,
  link: contractLink
})

window.ethereum.enable().then(function () {
  web3Resolver.web3 = new Web3(window.ethereum)
  apolloClient.resetStore()
})
```

Now you can use Ethereum contracts as a data source!  Here is an example using React:

```jsx
const GET_TOKEN_INFO = gql`
  query GetTokenInfo($tokenAddress: String!) {
    ERC20Token @contract(address: $tokenAddress) {
      totalSupply
      myBalance: balanceOf(address: "0xff536c5497c7b244c25ca6b31a5af1545d0c6184")
      allEvents @pastEvents(fromBlock: "0", toBlock: "latest")
    }
  }
`

export class App extends Component {
  render() {

    return (
      <Query
        query={GET_TOKEN_INFO}
        variables={ { address: "0xa95e94ac1d1e5c57413a281f0197140fbb6d4ccf" } }>

        {({ data }) => {
          return (
            <div className="App">
              <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                  Network Status: {get(data, 'status.isConnected', 'Unknown')}
                </p>
                <p>
                  Edit <code>src/App.js</code> and save to reload.
                </p>
                <p>
                  <i>{(get(data, 'ERC20Token.myBalance') || '').toString()}</i>
                  <br />
                  <i>{(get(data, 'ERC20Token.totalSupply') || '').toString()}</i>
                  <br />
                  <i>{(get(data, 'ERC20Token.allEvents') || []).length}</i>
                </p>
                <a
                  className="App-link"
                  href="https://reactjs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn React
                </a>
              </header>
            </div>
          )
        }}

      </Query>
    )
  }
}
```

## `@contract` Directive

This custom directive sets up a contract context.  The name is used to look up the ABI, and you can set the contract address using the `address` parameter.  For example:

```javascript
const GET_TOKEN_INFO = gql`
  query GetTokenInfo($tokenAddress: String!) {
    ERC20Token @contract(address: $tokenAddress) {
    }
  }
}
`
```

The above example will lookup the ABI using the name 'ERC20Token', and set the contract address to be the parameter `$tokenAddress`.

## `@call` Directive

By default, fields without any directives will be treated as a `@call`.  A call is just a standard ethereum contract call.  You can pass parameters to the field, and pass options to the call using the @call directive.

## `@pastEvents` Directive

This directive will retrieve all past events for the contract.  It will use the name of the field as the filter so you can target specific events.  If the name of the field is 'allEvents' then all of the events will be retrieved.

## Development

The yarn watch command runs both the typescript transpilation and rollup to build the JS into a distributable:

`$ cd packages/apollo-link-ethereum && yarn watch`

`$ cd packages/apollo-link-ethereum-resolver-web3js && yarn watch`
