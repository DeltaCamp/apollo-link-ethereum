import sourcemaps from 'rollup-plugin-sourcemaps'

export const globals = {
  'apollo-link': 'apolloLink.core',
  'apollo-utilities': 'apollo.utilities',
  'apollo-link-ethereum': 'apolloLinkWeb3'
  'web3': 'Web3',
  'ethers': 'ethers'
}

export default (name, extraGlobals) => ({
  input: 'lib/index.js',
  output: {
    file: 'dist/bundle.umd.js',
    format: 'umd',
    globals: Object.assign({}, globals, extraGlobals || {}),
    sourcemap: true,
    exports: 'named',
    name
  },
  external: Object.keys(globals),
  plugins: [sourcemaps()]
})
