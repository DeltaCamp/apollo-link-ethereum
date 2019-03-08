import gql from 'graphql-tag'

export const transactionFragment = gql`
  fragment transaction on Transaction {
    id
    args {
      values
    }
    contractName
    contractAddress
    blockNumber
    completed
    error
    hash
    method
    sent
  }
`
