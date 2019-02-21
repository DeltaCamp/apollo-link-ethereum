import gql from 'graphql-tag'

export const sendTransactionMutation = gql`
  mutation sendTransactionMutation($contractName: String!, $method: String!, $args: Object!) {
    sendTransaction(contractName: $contractName, method: $method, args: $args) @client
  }
`
