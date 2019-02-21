import build from '../../rollup.config'

import pkg from './package.json'

export default build(pkg.name, {
  'ethers': 'ethers',
  'graphql-tag': 'gql'
})
