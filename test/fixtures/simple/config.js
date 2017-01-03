var hljs = require('highlight.js').highlight
var content = require('reshape-content')({
  highlight: text => hljs('js', text).value
})

module.exports = {
  browserSync: {
    port: '5678'
  },
  outputDir: 'public',
  locals: {
    name: 'Caleb'
  },
  transformers: {
    reshape: {
      parser: 'sugarml',
      plugins: [
        content
      ]
    },
    'uglify-js': {
      mangle: {
        toplevel: true
      }
    },
    rollup: {
      format: 'es',
      plugins: {
        'rollup-plugin-node-resolve': {},
        'rollup-plugin-commonjs': {}
      }
    }
  },
  files: {
    'styles.styl': {
      transforms: 'stylus | autoprefixer | csso',
      dependencies: [
        '**/*.css',
        '**/*.styl'
      ]
    },
    '**/*.sml': 'reshape',
    'app.js': 'rollup | buble | uglify-js'
  }
}
