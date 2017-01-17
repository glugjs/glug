#!/usr/bin/env node

var path = require('path')
var {fork} = require('child_process')
var fs = require('graceful-fs')
var logUpdate = require('log-update')
var symbols = require('log-symbols')
var chokidar = require('chokidar')
var browserSync = require('browser-sync')
var chalk = require('chalk')
var {sync: glob} = require('glob')
var figures = require('figures')
var spinner = require('elegant-spinner')
var {recursive: merge} = require('merge')
var basePath = process.cwd()
var {addPath} = require('app-module-path')

addPath(path.join(basePath, 'node_modules'))
addPath(basePath)

var bs
var config
var configPath = 'cletonfig.js'
var rootConfigPath = path.join(basePath, 'config.js')
const maxWorkers = 4

var defaultConfig = {
  transformers: {},
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

var dependencies = {}
//  dependencies = {
//    'helpers.styl': ['index.styl']
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
    } else if (file.state === 'started') {
      icon = chalk.blue(file.spinner())
    } else if (file.state === 'pending') {
      icon = chalk.yellow(file.spinner())
    } else {
      icon = ' '
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

setInterval(updateOutput, 100)

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
global.console.error = print

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

checkForWorkers = function () {
  for (let worker of workers) {
    if (worker.open) {
      worker.open = false
      return worker
    }
  }
  return false
}

createWorker = function () {
  workers.push({
    worker: fork(path.join(__dirname, 'render-file')),
    open: false
  })
  return workers[workers.length - 1]
}

awaitWorker = function () {
  return new Promise((resolve, reject) => {
    let checker = setInterval(() => {
      let maybeWorker = checkForWorkers()
      if (maybeWorker) {
        clearInterval(checker)
        maybeWorker.open = false
        resolve(maybeWorker)
      }
    }, 200)
  })
}

/**
 * Returns a promise for a worker
 */
var getWorker = function () {
  return new Promise((resolve, reject) => {
    if (workers.length < maxWorkers) {
      return resolve(createWorker())
    }
    awaitWorker().then(resolve)
  })
}

/**
 * Renders the given file
 * Returns a promise for when it is done
 */
var renderFile = function (file) {
  return new Promise((resolve, reject) => {
    if (
      files[file].state === 'started' ||
      files[file].state === 'pending'
    ) {
      return resolve(false)
    }

    files[file] = files[file] || {}
    files[file].state = 'pending'

    getWorker().then(worker => {
      files[file].state = 'started'
      worker.currentFile = file
      worker.worker.send({
        filename: file,
        file: files[file],
        inputDir: config.inputDir,
        outputDir: config.outputDir,
        configPath,
        rootConfigPath
      })

      var handleMessage = function (message) {
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
          worker.worker.removeListener('message', handleMessage)
          return resolve(true)
        }
      }

      worker.worker.on('message', handleMessage)
    })
  }).then(reload => {
    if (reload && bs.reload) {
      bs.reload(files[file].outputPath)
    }
  })
}

/**
 * Renders all files
 */
var render = function () {
  return new Promise(() => {
    for (let file in files) {
      if ({}.hasOwnProperty.call(files, file)) {
        renderFile(file).catch(handleErr)
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
    logFileChanges: false,
    server: config.outputDir
  }

  bs = browserSync.create()
  bs.init(merge(defaultBrowserSyncConfig, config.browserSync))
}

/**
 * Starts the chokidar input file watcher
 */
let startWatcher = function () {
  chokidar.watch([config.inputDir, configPath])
    .on('all', (event, file) => {
      if (file === configPath) {
        files = {}
        dependencies = {}
        return readConfig().then(render).catch(handleErr)
      }
      file = file.replace(config.inputDir + '/', '')
      file = file.replace(config.inputDir + '\\', '')
      if (files[file]) {
        renderFile(file).catch(handleErr)
      } else if (dependencies[file]) {
        dependencies[file].forEach(sourceFile => {
          renderFile(sourceFile).catch(handleErr)
        })
      }
    })
}

/**
 * Reads the config at `config.js`
 * Returns a promise for the parsed config
 * Sets up the global `files` variable
 */
var readConfig = function () {
  return new Promise((resolve, reject) => {
    delete require.cache[require.resolve(rootConfigPath)]
    resolve(require(rootConfigPath))
  }).then(newConfig => {
    config = merge(defaultConfig, newConfig)
  }).then(() => {
    for (let fileGroup in config.files) {
      if ({}.hasOwnProperty.call(config.files, fileGroup)) {
        let group = config.files[fileGroup]
        // like **/*.js
        let renderers
        let fileDeps = group.dependencies || []
        if (typeof fileDeps === 'string') {
          fileDeps = [fileDeps]
        }

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

        let matchedFiles = glob(fileGroup, {cwd: config.inputDir})

        for (let dependencyGlob of fileDeps) {
          let matchedDependencies = glob(dependencyGlob, {
            cwd: config.inputDir
          })
          for (let dependency of matchedDependencies) {
            dependencies[dependency] = dependencies[dependency] || []
            dependencies[dependency] = dependencies[dependency]
              .concat(matchedFiles)
          }
        }

        for (let file of matchedFiles) {
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
