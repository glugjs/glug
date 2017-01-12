var fs = require('fs')
var hljs = require('highlight.js').highlight
var highlight = text => {
  return hljs('js', text).value
}

var config = highlight(fs.readFileSync('./app/config.js', 'utf8'))

module.exports = {
  browserSync: {
    port: '5678'
  },
  outputDir: 'public',
  locals: {
    name: 'Caleb',
    config
  },
  transformers: {
    reshape: {
      parser: 'sugarml',
      plugins: [
        require('reshape-expressions')()
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
    'app.js': {
      transforms: 'rollup',
      dependencies: '**/*.js'
    }
  }
}
