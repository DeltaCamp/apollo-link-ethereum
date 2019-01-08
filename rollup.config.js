import sourcemaps from 'rollup-plugin-sourcemaps'

export const globals = {
  'apollo-link': 'apolloLink.core',
  'apollo-utilities': 'apollo.utilities'
}

export default name => ({
  input: 'lib/index.js',
  output: {
    file: 'dist/bundle.umd.js',
    format: 'umd',
    globals,
    sourcemap: true,
    exports: 'named',
    name
  },
  external: Object.keys(globals),
  plugins: [sourcemaps()]
})
