import gql from 'graphql-tag'

export const sendTransactionMutation = gql`
  mutation sendTransactionMutation(
    $contractName: String!,
    $contractAddress: String,
    $method: String!,
    $args: Object!,
    $gasLimit: String,
    $scaleGasEstimate: String,
    $value: String,
    $minimumGas: String
  ) {
    sendTransaction(
      contractName: $contractName,
      contractAddress: $contractAddress,
      method: $method,
      args: $args,
      gasLimit: $gasLimit,
      value: $value,
      scaleGasEstimate: $scaleGasEstimate,
      minimumGas: $minimumGas
    ) @client
  }
`
