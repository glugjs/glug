#!/usr/bin/env node

var basePath = process.cwd()
require('app-module-path').addPath(`${basePath}/node_modules`)
var path = require('path')
var {fork} = require('child_process')
var fs = require('graceful-fs')
var logUpdate = require('log-update')
var symbols = require('log-symbols')
var chokidar = require('chokidar')
var Hjson = require('hjson')
var browserSync = require('browser-sync')
var chalk = require('chalk')
var {sync: glob} = require('glob')
var figures = require('figures')
var spinner = require('elegant-spinner')
var {recursive: merge} = require('merge')

var bs
var config

var defaultConfig = {
  inputDir: 'app',
  outputDir: 'public',
  locals: {},
  files: {},
}

var workers = []
//  workers = [
//    {
//      open: false,
//      worker: {worker}
//    }
//  ]

var files = {}
//  files = {
//    'index.js': {
//      renderers: ['babel', 'browserify']
//      dependencyOf: []
//    },
//    'foo.js': {
//      renderers: ['babel', 'browserify']
//      dependencyOf: ['index.js']
//    },
//    'index.pug': {
//      renderers: ['pug', 'html-minifier']
//      dependencyOf: []
//    }
//  }

var last = function (array) {
  return array[array.length - 1]
}

var updateOutput = function () {
  var string = Object.keys(files).map(filename => {
    var file = files[filename]
    var icon

    if (!file.spinner) {
      file.spinner = spinner()
    }

    if (file.state === 'completed') {
      icon = symbols.success
    } else if (file.state === 'writing') {
      icon = chalk.green(file.spinner())
    } else if (file.state === 'error') {
      icon = symbols.error
    } else {
      icon = chalk.blue(file.spinner())
    }

    let renderers = chalk.gray(file.renderers
      .map(renderer => {
        if (renderer === file.current) {
          return chalk.cyan.underline(renderer)
        }
        return renderer
      })
      .join(` ${chalk.cyan(figures('›'))} `))

    let string = `${icon} ${chalk.bold(filename)} ${renderers}`

    if (file.state === 'error' && file.error) {
      string += file.error
    }

    return string
  }).join('\n')
  logUpdate(string)
}

setInterval(updateOutput, 150)

/**
 * Prints to the console, and resets the persistent log
 */
var print = function () {
  logUpdate.clear()
  // console.info is equivalent to console.log
  // using console.info because console.log is overwritten
  // and we don't want infinite loop
  console.info(...arguments)
  updateOutput()
}

global.console.log = print

/**
 * Will throw an error, if it exists
 * @param {(Object|string|null)} error - The error to throw or null
 */
var handleErr = function (error) {
  if (error) {
    if (error.stack) {
      error = error.stack
    }
    print(chalk.red(error))
  }
}

/**
 * Returns a promise for a worker
 */
var getWorker = function () {
  return new Promise(resolve => {
    for (let worker of workers) {
      if (worker.open) {
        worker.open = false
        return resolve(worker)
      }
    }
    workers.push({
      worker: fork(path.join(__dirname, 'render-file')),
      open: false
    })
    resolve(workers[workers.length - 1].worker)
  })
}

/**
 * Renders the given file
 * Returns a promise for when it is done
 */
var renderFile = function (file) {
  return new Promise((resolve, reject) => {
    files[file] = files[file] || {}
    files[file].state = 'started'

    getWorker().then(worker => {
      worker.send({
        filename: file,
        file: files[file],
        inputDir: config.inputDir,
        outputDir: config.outputDir
      })

      worker.on('message', message => {
        if (message.transformer) {
          files[file].current = message.transformer
        } else if (message.print) {
          print(message.print)
        } else if (message.error) {
          files[file].state = 'error'
          files[file].error = message.error
          return reject()
        } else if (message === 'writing') {
          files[file].current = null
          files[file].state = 'writing'
        } else if (message === 'done') {
          files[file].state = 'completed'
          worker.open = true
          return resolve()
        }
      })
    })
  })
}

/**
 * Renders all files
 */
var render = function () {
  return new Promise(() => {
    for (let file in files) {
      if ({}.hasOwnProperty.call(files, file)) {
        renderFile(file)
          .catch(handleErr)
      }
    }
  })
}

/**
 * Starts browser sync in the global `bs`
 */
var startBrowserSync = function () {
  // https://www.browsersync.io/docs/options
  var defaultBrowserSyncConfig = {
    port: 1234,
    logLevel: 'warn',
    server: config.outputDir
  }

  bs = browserSync.create()
  bs.init(merge(defaultBrowserSyncConfig, config.browserSync))
}

/**
 * Starts the chokidar input file watcher
 */
let startWatcher = function () {
  chokidar.watch(config.inputDir).on('change', file => {
    file = file.replace(config.inputDir + '/', '')
    file = file.replace(config.inputDir + '\\', '')
    renderFile(file)
      .then(() => bs.reload(files[file].outputPath))
      .catch(handleErr)
  })
}

/**
 * Reads the config at `config.hjson`
 * Returns a promise for the parsed config
 * Sets up the global `files` variable
 */
var readConfig = function () {
  return new Promise((resolve, reject) =>
    fs.readFile('config.hjson', 'utf-8', (err, data) => {
      if (err) {
        if (err.message ===
          'ENOENT: no such file or directory, open \'config.hjson\'') {
          return reject('Can\'t find config at config.hjson')
        }
        return reject(err)
      }
      resolve(Hjson.parse(data))
    })
  ).then(newConfig => {
    config = merge(defaultConfig, newConfig)
  }).then(() => {
    for (let fileGroup in config.files) {
      if ({}.hasOwnProperty.call(config.files, fileGroup)) {
        let group = config.files[fileGroup]
        let renderers

        if (group.transforms) {
          group = group.transforms
        }

        if (typeof group === 'string') {
          renderers = group.split(' | ')
        } else if (Array.isArray(group)) {
          renderers = group
        }

        let outputFormat =
          // eslint-disable-next-line import/no-dynamic-require
          require(`jstransformer-${[last(renderers)]}`).outputFormat

        for (let file of glob(fileGroup, {cwd: config.inputDir})) {
          let outputPath = file.replace(path.extname(file), '.' + outputFormat)
          files[file] = {
            renderers,
            inputPath: file,
            outputPath
          }
        }
      }
    }
  })
}

var startConfigWatcher = function () {
  chokidar.watch('config.hjson').on('change', file => {
    print(arguments)
    // print('reloading config')
    // readConfig()
    //   .then(() => {
    //     startBrowserSync()
    //     render()
    //   })
  })
}

/**
 * The exported glug object
 * Has children `watch` and `build` which are functions
 * TODO: Add `init`
 */
var glug = {
  watch() {
    print('watching')
    return readConfig()
      .then(startBrowserSync)
      .then(startWatcher)
      .then(render)
      .catch(handleErr)
  },
  build() {
    print('building')
    return readConfig()
      .then(render)
      .catch(handleErr)
  }
}

// if called directly

if (require.main === module) {
  require('./cli')(glug, process.argv)
}

module.exports = glug
