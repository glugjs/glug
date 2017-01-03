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
          .title config.hjson
        .contents
          p(md) **hi**
          pre
            | {
            |   browserSync: {
            |     port: 5678
            |   }
            |   outputDir: public
            |   locals: {
            |     name: Caleb
            |   }
            |   transformers: {
            |     uglify-js: {
            |       mangle: {
            |         toplevel: true
            |       }
            |     }
            |     rollup: {
            |       format: es
            |     }
            |   }
            |   files: {
            |     **/*.styl: stylus | autoprefixer | csso
            |     **/*.pug: pug | html-minifier
            |     app.js: rollup | buble | uglify-js
            |   }
            | }

    script(src="/app.js")

