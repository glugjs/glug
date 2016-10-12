jeet = require('jeet')
rupture = require('rupture')
axis = require('axis')

module.exports =

  input_dir: 'app'
  output_dir: 'public'
  views_dir: 'views'
  
  layout_extension: 'slm'

  transformers:

    slm: true

    autoprefixer: true

    # 'clean-css': true

    'html-minifier': true

    'markdown-it':
      highlight: true
      html: true

    stylus:
      minify: true
      # use: jeet()
      use: [
        jeet()
        rupture()
        axis()
      ]
      # use_modules: [
      #   'jeet'
      #   'rupture'
      #   'axis'
      # ]
    pug:
      filename: 'app/views/'
    'coffee-script': {}

  server:
    port: 1234
    templates:
      notFound: '404.html'
