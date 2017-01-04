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
          pre(highlight) {{ config }}

    script(src="/app.js")

