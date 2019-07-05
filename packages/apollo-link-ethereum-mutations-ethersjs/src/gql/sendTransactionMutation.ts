import gql from 'graphql-tag'

export const sendTransactionMutation = gql`
  mutation sendTransactionMutation(
    $contractName: String!,
    $contractAddress: String,
    $method: String!,
    $args: Object!,
    $gasLimit: String!,
    $value: String
  ) {
    sendTransaction(
      contractName: $contractName,
      contractAddress: $contractAddress,
      method: $method,
      args: $args,
      gasLimit: $gasLimit,
      value: $value
    ) @client
  }
`
