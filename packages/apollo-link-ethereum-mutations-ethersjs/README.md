# apollo-link-ethereum-mutations-ethersjs

Allows applications using [Apollo Client](https://www.apollographql.com/docs/tutorial/client.html#apollo-client-setup) to easily transact with the Ethereum blockchain using [Ethers.js](https://github.com/ethers-io/ethers.js/).  This package uses [Local State Management](https://www.apollographql.com/docs/react/essentials/local-state.html) in Apollo Client to manage Ethereum transactions.

# Setup

First you must make sure that you're using local state management.  If you're using Apollo Boost it's already included.  Otherwise, you'll need to integrate [apollo-link-state](https://www.apollographql.com/docs/link/links/state.html).

You must include the mutation when you setup the client state resolvers:

```javascript
import { sendTransactionWithOptions } from 'apollo-link-ethereum-mutations-ethersjs'

// ...

const stateLink = withClientState({
  resolvers: {
    Mutation: {
      sendTransaction: sendTransactionWithOptions({
        provider: ethersProvider,
        abiMapping
      })
    }
  },
  cache
})
```

The `sendTransactionWithOptions` function returns a copy of the `sendTransaction` function whose options argument is bound to the passed options.

Alternatively, you can wrap the `sendTransaction` function yourself:

```javascript
import { sendTransaction } from 'apollo-link-ethereum-mutations-ethersjs'

const stateLink = withClientState({
  resolvers: {
    Mutation: {
      sendTransaction: async (rootData, variables, context, info) => {
        return sendTransaction({
          provider: ethersProvider,
          abiMapping
        }, rootData, variables, context, info)
      }
    }
  },
  cache
})
```

# Usage

Once the client state resolver is setup we will be able to call it from a GraphQL mutation.  If you have defined the mutation using the name `sendTransaction` as above, then you can reuse the included GQL mutation definition in [sendTransactionMutation](src/gql/sendTransactionMutation.ts).

Otherwise, you can manually define the mutation:

```javascript
import gql from 'graphql-tag'

export const sendTransactionMutation = gql`
  mutation sendTransactionMutation(
    $contractName: String!,
    $contractAddress: String,
    $method: String!,
    $args: Object!
  ) {
    sendTransaction(
      contractName: $contractName,
      contractAddress: $contractAddress,
      method: $method,
      args: $args
    ) @client
  }
`
```

Here is an example of using the mutation in a React component:

```javascript
import { sendTransactionMutation } from 'apollo-link-ethereum-mutations-ethersjs'

export const TransactionForm = graphql(sendTransactionMutation, { name: 'sendTransaction' })(
  class _TransactionForm extends Component {
    constructor(props) {
      super(props)
      this.state = {
        transactionId: null
      }
    }

    submit = () => {
      if (this.state.transactionId) {
        return null // already sent
      }
      const data = this.props.sendTransaction({
        variables: {
          contractName: 'ERC20Token',
          method: 'approve',
          args: ['0x1234', '1000000000000']
        }
      })

      const transactionId = data.sendTransaction.id

      this.setState({
        transactionId
      })
    }

    render () {
      return (
        <Form onSubmit={this.submit} />
      )
    }
  }
)
```

You'll notice that the `sendTransaction` function returns the initial transaction object.  You can pull the id out so that you can watch the progress of the transaction.  The shape of the transaction follows [the transaction fragment](src/gql/transactionFragment.ts).

## Listings Transactions

To read transactions, you can use the [allTransactionsQuery](src/gql/allTransactionsQuery.ts):

```javascript
import { allTransactionsQuery } from 'apollo-link-etheruem-mutations-ethersjs'

export const TransactionList = graphql(allTransactionsQuery)(
  function ({ data }) {
    return <React.Fragment>
      {this.props.data.transactions.map(tx => <TxRow tx={tx} />)}
    </React.Fragment>
  }
)
```
