module.exports =

  slm: require('jstransformer-slm')
  'html-minifier': require('jstransformer-html-minifier')
  'markdown-it': require('jstransformer-markdown-it')
  'autoprefixer': require('jstransformer-autoprefixer')
  'stylus': require('jstransformer-stylus')

  input_dir: 'app'
  output_dir: 'public'
  views_dir: 'views'
  
  layout_extension: 'slm'

  transformers:

    slm: true
    'markdown-it':
      highlight: true

    'html-minifier': true

    'stylus': true
    'autoprefixer': true

  server:
    port: 1234
    templates:
      notFound: '404.html'
