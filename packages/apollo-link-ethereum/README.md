# Apollo Link Ethereum

`apollo-link-ethereum` allows you to use GraphQL to speak directly to a smart contract on the Ethereum blockchain.  The package integrates with [Apollo Client](https://www.apollographql.com) as a "link".  There are several "resolvers" so that you can resolve web3 calls using either web3js 1.0 or Ethers.js.  A separate mutations package is available to actually execute transactions.

| Package | Description |
| --- | --- |
| [apollo-link-ethereum](./packages/apollo-link-ethereum/README.md) | The base package |
| [apollo-link-ethereum-resolver-web3js](./packages/apollo-link-ethereum-resolver-web3js) | Resolve calls using Web3js 1.0 |
| [apollo-link-ethereum-resolver-ethersjs](./packages/apollo-link-ethereum-resolver-ethersjs) | Resolve calls using Ethers.js |
| [apollo-link-ethereum-mutations-ethersjs](./packages/apollo-link-ethereum-mutations-ethersjs) | Send transactions with Ethers.js |

To see a simple read-only app see the [apollo-link-ethereum-example](https://github.com/DeltaCamp/apollo-link-ethereum-example).  Otherwise, for a more complex application have a look at [ZeppelinOS Registry](https://github.com/zeppelinos/zos-registry).

# Installation

```bash
$ yarn add apollo-link-ethereum
```

You'll need to either install the [Ethers.js package](./packages/apollo-link-ethereum-resolver-ethersjs) or the [Web3.js package](./packages/apollo-link-ethereum-resolver-web3js) in order to make calls to Ethereum.  Currently the **Ethers.js** resolver is more robust.

In your app, you'll need to add the [EthereumLink](./packages/apollo-link-ethereum/src/EthereumLink.ts) to your Apollo Client:

```javascript
import { EthersResolver } from 'apollo-link-ethereum-resolver-ethersjs'
import { EthereumLink, AbiMapping } from 'apollo-link-ethereum'

export const abiMapping = new AbiMapping()
abiMapping.addAbi('MKR', mkrAbi) // assuming mkrAbi is an ABI
abiMapping.addAddress('MKR', 1, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2')

const ethersProvider = new ethers.getDefaultProvider('homestead')

const ethersResolver = new EthersResolver({
  abiMapping,
  ethersProvider
})

const ethereumLink = new EthereumLink(ethersResolver)

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: ethereumLink
})
```

# Reference

## EthereumLink

The object that determines whether queries are Ethereum queries or not.  It takes a resolver as an argument.  You can use either one of the Web3.js or Ethers.js resolvers.

- ```new EthereumLink(resolverInstance)``` Creates a new EthereumLink with the given resolver.

## AbiMapping

The object that stores the contract names, network addresses, and ABIs.

- ```AbiMapping#addAbi(contractName, abi)``` Adds an ABI that can be looked up by the contract name.
- ```AbiMapping#addAddress(contractName, networkId, address)``` Adds a network-specific address for a contract name.  This is used to automatically find contract addresses given a contract name.
