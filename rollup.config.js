const pkg = require('./package.json')

export default {
  external: ['apollo-link', 'debug'],
  input: 'lib/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'es'
  }
};
