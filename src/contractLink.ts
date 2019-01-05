import { ApolloLink } from 'apollo-link'
const debug = require('debug')('contractLink.js')

const contractLink = new ApolloLink((operation, forward) => {
  debug(operation)
  return forward(operation);
})

module.exports = contractLink
