doctype html
html
  head
    title Glug
    link(rel="stylesheet" href="/styles.css")
  body
    h1 Glug
    p.subtitle The ultimate build tool, powered by JSTransformers

    .window.terminal
      .toolbar
        .close.icon
        .min.icon
        .max.icon
        .title Terminal
      .contents: pre#contents

    section#configuration
      h2 Configuration
      .window.editor
        .toolbar
          .close.icon
          .min.icon
          .max.icon
          .title config.js
        .contents
          pre(highlight)
            | module.exports = {
            |   browserSync: {
            |     port: '5678'
            |   },
            |   outputDir: 'public',
            |   locals: {
            |     name: 'Caleb'
            |   },
            |   transformers: {
            |     reshape: {
            |       parser: 'sugarml'
            |     },
            |     'uglify-js': {
            |       mangle: {
            |         toplevel: true
            |       }
            |     },
            |     rollup: {
            |       format: 'es'
            |     }
            |   },
            |   files: {
            |     '**/*.styl': {
            |       transforms: 'stylus | autoprefixer | csso',
            |       depends_on: [
            |         '**/*.css',
            |         '**/*.styl'
            |       ]
            |     },
            |     '**/*.sml': 'reshape',
            |     'app.js': 'rollup | buble | uglify-js'
            |   }
            | }

    script(src="/app.js")

