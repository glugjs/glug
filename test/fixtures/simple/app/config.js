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
      plugins: []
    },
    'uglify-js': {
      mangle: {
        toplevel: true
      }
    },
    rollup: {
      format: 'es'
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
      transforms: 'rollup | buble | uglify-js',
      dependencies: '**/*.js'
    }
  }
}
