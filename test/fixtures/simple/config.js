var hljs = require('highlight.js').highlight
var content = require('reshape-content')({
  highlight: text => {
    console.log(`highlighting ${text}`)
    return hljs('js', text).value
  }
})

module.exports = {
  browserSync: {
    port: '5678'
  },
  outputDir: 'public',
  locals: {
    name: 'Caleb',
    config: JSON.stringify(require('./app/config'), null, 2)
  },
  transformers: {
    reshape: {
      parser: 'sugarml',
      plugins: [
        require('reshape-expressions')(),
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
