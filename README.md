# Apollo Link Ethereum

`apollo-link-ethereum` allows you to use GraphQL to speak directly to a smart contract on the Ethereum blockchain.  The package integrates with [Apollo Client](https://www.apollographql.com) as a "link".  There are several "resolvers" so that you can resolve web3 calls using either web3js 1.0 or Ethers.js.  A separate mutations package is available to actually execute transactions.

Please see the documentation for each package for more information.

| Package | Description |
| --- | --- |
| [apollo-link-ethereum](./packages/apollo-link-ethereum) | The base package |
| [apollo-link-ethereum-resolver-ethersjs](./packages/apollo-link-ethereum-resolver-ethersjs) | Resolve calls using Ethers.js |
| [apollo-link-ethereum-mutations-ethersjs](./packages/apollo-link-ethereum-mutations-ethersjs) | Send transactions with Ethers.js |
| [apollo-link-ethereum-resolver-web3js](./packages/apollo-link-ethereum-resolver-web3js) | Resolve calls using Web3js 1.0 |

**Examples**

To see a simple read-only app see the [apollo-link-ethereum-example](https://github.com/DeltaCamp/apollo-link-ethereum-example).  Otherwise, for a more complex application have a look at [ZeppelinOS Registry](https://github.com/zeppelinos/zos-registry).

# Installation

You'll need to install the base package [apollo-link-ethereum](./packages/apollo-link-ethereum/README.md) and one of the resolver packages.  If you'd like to execute transactions you should also install the mutations package for the bindings you've selected.  Currently there is only a mutations package for Ethers.js.

# Development

We use yarn and lerna. Run yarn to install the lerna dependency:

`$ yarn`

Then use lerna to set up the child packages:

`$ lerna bootstrap`

### Live compilation

The yarn watch command runs both the typescript transpilation and rollup to build the JS into a distributable:

```
$ yarn watch
```
