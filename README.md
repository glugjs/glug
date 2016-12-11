# Glug: A **very cool** build tool

[![NPM Version](https://img.shields.io/npm/v/glug.svg)](https://www.npmjs.com/package/glug)
[![Chat on Gitter](https://img.shields.io/gitter/room/glugjs/glug.svg)](https://gitter.im/glugjs/glug?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![David Dependencies](https://img.shields.io/david/glugjs/glug.svg)](https://david-dm.org/glugjs/glug)
[![Code Climate](https://img.shields.io/codeclimate/github/glugjs/glug.svg)](https://codeclimate.com/github/glugjs/glug)
[![Travis Build Status](https://img.shields.io/travis/glugjs/glug.svg)](https://travis-ci.org/glugjs/glug)


## Installation

```
npm i -g glug
```

## Usage

```
Usage: glug [options] [command]


Commands:

  init [options] <directory>     set up a new project
  watch|w [options] [directory]  start a server
  build|b [options] [directory]  build the project

Options:

  -h, --help     output usage information
  -V, --version  output the version number
```

## Configuration

All projects using glug need a `glug-config.coffee` file.

Example of current configuration:

```coffee
module.exports =

  locals:
    name: 'Caleb'

  transformers:

    stylus: true
    pug: true
    svgo: true
    csso: true
    autoprefixer: true
    'html-minifier': true
    'uglify-js': true

  pipelines:
    IMG:
      optimize:
        '**/*.svg': 'svgo'

    HTML:
      syntax:
        '**/*.pug': [
          'pug'
          'html-minifier'
        ]

    JS:
      syntax:
        '**/*.js': 'uglify-js'
        '**/*.coffee': [
          'coffee-script'
          'uglify-js'
        ]

    CSS:
      syntax:
        '**/*.styl': [
          'stylus'
          'autoprefixer'
          # 'csso'
        ]

```

## Proposed Future Configuration

```coffee
module.exports =

  locals:
    name: 'Caleb'

  files:
    # pass a single transformer
    '**/*.svg': 'svgo'
    '**/*.js': 'uglify-js'
    # or pipe them like unix pipes
    '**/*.coffee': 'coffee-script | uglify-js'
    '**/*.styl':
      transforms: 'stylus | autoprefixer | csso'
      # specify dependencies
      # stylus files will be rebuilt when css or files change
      depends_on: ['**/*.css', '**/*.styl']
    # or, if you prefer, pass an array
    '**/*.pug': ['pug', 'html-minifier']
```
