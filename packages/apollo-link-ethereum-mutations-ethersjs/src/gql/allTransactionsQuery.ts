import gql from 'graphql-tag'
import { transactionFragment } from './transactionFragment'

export const allTransactionsQuery = gql`
  query allTransactionsQuery {
    transactions @client {
      ...transaction
    }
  }
  ${transactionFragment}
`
