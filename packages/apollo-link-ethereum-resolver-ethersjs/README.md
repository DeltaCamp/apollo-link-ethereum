# apollo-link-ethereum-resolver-ethersjs

Ethers.js bindings for [apollo-link-ethereum](../..).

# Setup

Install required packages:

```bash
$ yarn add apollo-link-ethereum apollo-link-ethereum-resolver-ethersjs
```

Setup a new Apollo Client:

```javascript
import { ApolloClient } from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { withClientState } from 'apollo-link-state'
import { EthereumLink } from 'apollo-link-ethereum'
import { EthersResolver } from 'apollo-link-ethereum-resolver-ethersjs'
import { AbiMapping } from 'apollo-link-ethereum'
import { ethers } from 'ethers'

import mkrAbi from './mkrAbi'

export const abiMapping = new AbiMapping()
abiMapping.addAbi('MKR', mkrAbi)
abiMapping.addAddress('MKR', 1, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2')

const provider = new ethers.getDefaultProvider('homestead')

const ethersResolver = new EthersResolver({
  abiMapping,
  provider
})

const ethereumLink = new EthereumLink(ethersResolver)

const cache = new InMemoryCache()

const stateLink = withClientState({
  cache
})

export const apolloClient = new ApolloClient({
  cache,
  link: ApolloLink.from([stateLink, ethereumLink])
})
```

Now you can use Ethereum contracts as a data source.

# Usage

GraphQL queries are supported by custom directives.

## Query Directives

- [`@contract`](#contract-directive): declares that the query and sub-queries are for an Ethereum contract.
- [`@call`](#call-directive): interprets the query as an `eth_call` (default for sub-queries of `@contract`)
- [`@pastEvents`](#past-events-directive): retrieves past events of a contract

## Subscription Directives

- [`@block`](#block-directive): subscribes to new blocks
- [`@contract`](#contract-directive): declares that the query and sub-queries are for an Ethereum contract.
- [`@events`](#events-directive): listens for new events from the containing `@contract`

# Example

```javascript
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

# Reference

## EthersResolver

Provides Ethers.js bindings for EthereumLink.  You'll need to create an instance of EthersResolver and pass it to the EthereumLink constructor.

`new EthersResolver(options)`

Creates a new EthersResolver.

| Option            | Description |
| ---               | ---         |
| abiMapping        | instance of [AbiMapping](https://github.com/DeltaCamp/apollo-link-ethereum/blob/master/packages/apollo-link-ethereum/src/AbiMapping.ts) |
| provider          | [Ethers.js provider](https://docs.ethers.io/ethers.js/html/api-providers.html)
| defaultFromBlock  | the block number to use as the default "fromBlock" for event queries if none is provided. |
| defaultToBlock    | the block number to use as the default "toBlock" for event queries if none is provided. |

## Query Directives

## <a id='contract-directive'></a> @contract

Sets up the context of a query containing web3 calls.  This can be used in either a query or a subscription. The field name to which the `@contract` directive is applied will be used as the contract name for ABI and address lookups.  You will likely need to use the `type` and `id` arguments to @contract in order for Apollo Client to correctly cache the results.

For example:

```javascript
const GET_TOKEN_INFO = gql`
  query GetTokenInfo {
    myResult: ERC20Token @contract {
      totalSupply
    }
  }
}
`
```

Here we see the field `ERC20Token` has the `@contract` directive and is being aliased to `myResult`.  ERC20Token will be used as the contract name.

### @contract Arguments

- `type`: The name to use as the `__typename` for the results.  This is important to Apollo Client so that it can distinguish objects in the cache.  By default it will use the name of the contract, but if you wish to separate sets of calls you can do so with the type argument.
- `id`: The id to set in the result.  Since Ethereum calls do not generate a GraphQL compliant shape, we can set an id field to help Apollo Client out.
- `address`: The address of the contract.  Normally this is determined by looking up the address using the [AbiMapping](https://github.com/DeltaCamp/apollo-link-ethereum/blob/master/packages/apollo-link-ethereum/src/AbiMapping.ts).  Otherwise you can override it here.

If you would like to override the address:

```javascript
const GET_TOKEN_INFO = gql`
  query GetTokenInfo($tokenAddress: String!) {
    ERC20Token @contract(address: $tokenAddress) {
      totalSupply
    }
  }
}
`
```

The above example will lookup the ABI using the name 'ERC20Token', and set the contract address to be the parameter `$tokenAddress`.

## <a id='call-directive'></a> @call

By default, fields within a `@contract` query that don't have any custom directives will be treated as a `@call`.  A call is just a standard Ethereum contract call.  You can pass parameters to the field, and pass options to the call using the @call directive.

For example:

```javascript
const GET_TOKEN_INFO = gql`
  query GetTokenInfo {
    ERC20Token @contract {
      totalSupply
    }
  }
}
`
```

The field `totalSupply` will default to a `@call` directive.  The directive will call the `totalSupply` function on the `ERC20Token` contract as defined in the AbiMapping.

### @call Arguments

 - all arguments to the field will be reduced to a flat array and passed to Ethereum.
 - all arguments to the directive will be passed as options to Ethers, allowing you to override gas price, limit etc.

Argument example:

 ```javascript
 const GET_TOKEN_INFO = gql`
   query GetTokenInfo {
     ERC20Token @contract {
       balanceOf(address: '0x1c127465b8ba9cab06b014551ff5c809cadb59bd') @call(gasLimit: 500000)
     }
   }
 }
 `
 ```

Will call `ERC20Token#balanceOf("0x1c127465b8ba9cab06b014551ff5c809cadb59bd")` with a gas limit of 500000.  See [Ethers.js](https://docs.ethers.io/ethers.js/html/api-contract.html#overrides) for more details on what can be overridden.

## <a id='past-events-directive'></a> @pastEvents

This directive will retrieve all past events for the contract.  It will use the name of the field as the filter so you can target specific events.  If the name of the field is 'allEvents' then all of the events will be retrieved.

For example:

```javascript
const GET_TOKEN_INFO = gql`
  query GetTokenInfo($address: String!) {
    ERC20Token @contract {
      allEvents @pastEvents(extraTopics: { types: ["uint256", "address", "address"], values: [null, null, $address] })
    }
  }
`
```

The above query will retrieve all past logs for the ERC20Token contract defined in the AbiMapping.  Because the field name is `allEvents`, topic0 will be a wildcard.  The remaining topics will be interpreted as 'extra topics'.

You may also wish to look for specific events:

```javascript
const GET_TOKEN_INFO = gql`
  query GetTokenInfo($address: String!) {
    ERC20Token @contract {
      Transfer(fromAddress: $address) @pastEvents(fromBlock: "430000", toBlock: "450000")
    }
  }
`
```

The above query will retrieve all `Transfer` events whose first argument matches `$address` between blocks 430000 and 450000.  Note here that field arguments will be reduced to a flat array, so the `fromAddress` in this case is unused.

### @pastEvents Arguments

If the field name is `allEvents`, then topic0 will be the wildcard topic.  Otherwise, the ABI will be used to determine topic0.

- field arguments are reduced to a flat array and encoded as additional topics (not applicable for field name `allEvents`)
- directive arguments:
  - address: override the contract address
  - fromBlock: the starting block number for the search
  - toBlock: the last block number for the search
  - extraTopics: extra topics to be concatentated onto the base topics.  It's an object with two fields `types` and `values`:
    - types: an array of the solidity data types of the fields
    - values: an array of the values to encode

## Subscription Directives

## @contract

Same as [@contract](#contract-directive) above.

## @events

Same interface as [@pastEvents](#past-events-directive), but used to listen to new events.

For example:

```javascript
const transferSubscription = gql`
  subscription transferSubscription {
    ERC20Token @contract {
      Transfer @events
    }
  }
`
```

Will listen for all Transfer events from the ERC20Token contract.
