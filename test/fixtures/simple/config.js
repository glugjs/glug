var markdown = require('markdown-it')({})
var content = require('reshape-content')({
  md: (md) => markdown.render(md)
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
    '**/*.styl': {
      transforms: 'stylus | autoprefixer | csso',
      depends_on: [
        '**/*.css',
        '**/*.styl'
      ]
    },
    '**/*.pug': 'pug | html-minifier',
    '**/*.sml': 'reshape',
    'app.js': 'rollup | buble | uglify-js'
  }
}
