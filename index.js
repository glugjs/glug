#!/usr/bin/env node

var base_path = process.cwd()
require('app-module-path').addPath(`${base_path}/node_modules`)
var fs = require('graceful-fs')
var { join }= require('path')
var { fork } = require('child_process')
var logUpdate = require('log-update')
var symbols = require('log-symbols')
var Hjson = require('hjson')
var chalk = require('chalk')
var { sync: glob } = require('glob')
var figures = require('figures')
var spinner = require('elegant-spinner')
var { sleep } = require('sleep')
var { recursive: merge } = require('merge')

var json = function (data) {
  return JSON.stringify(data, null, 2)
}

var inputDir, outputDir

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
    } else {
      icon = chalk.blue(file.spinner())
    }

    renderers = chalk.gray(file.renderers
      .map(renderer => {
        if (renderer === file.current) {
          return chalk.white.underline(renderer)
        } else {
          return renderer
        }
      })
      .join(` ${chalk.cyan(figures('›'))} `))

    return `${icon} ${chalk.bold(filename)} ${renderers}`
  }).join('\n')
  logUpdate(string)
}

setInterval(updateOutput, 50)

var print = function () {
  logUpdate.clear()
  console.log(...arguments)
  updateOutput()
}

/**
 * Will throw an error, if it exists
 * @param {(Object|string|null)} error - The error to throw or null
 */ 
var handleErr = function (error) {
  if (error) {
    if (error.stack) {
      error = error.stack
    }
    throw error
  }
}

/**
 * Returns a promise for a worker
 */
var getWorker = function () {
  return new Promise((resolve, reject) => {
    for (let worker of workers) {
      if (worker.open) {
        worker.open = false
        return resolve(worker)
      }
    }
    workers.push({
      worker: fork(join(__dirname, 'render-file')),
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
  files[file] = files[file] || {}
  files[file].state = 'started'

  getWorker().then(worker => {
    worker.send({
      filename: file,
      file: files[file],
      inputDir,
      outputDir
    })

    worker.on('message', message => {
      if (message === 'writing') {
        files[file].current = null
        files[file].state = 'writing'
      } else if (message === 'done') {
        files[file].state = 'completed'
      } else if (message.match(/^transformer:/)) {
        let transformer = message.replace(/^transformer:/, '')
        files[file].current = transformer
      } else if (message.match(/^print:/)) {
        message = message.replace(/^print:/, '')
        print(message)
      }
    })
  })
    .catch(handleErr)
}

var render = function (config) {
  return new Promise((resolve, reject) => {
    for (file in files) {
      renderFile(file)
    }
  })
}

var readConfig = function () {
  return new Promise((resolve, reject) =>
    fs.readFile('config.hjson', 'utf-8', (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(Hjson.parse(data))
    })
  ).then(config => {
    inputDir = join(process.cwd(), config.inputDir || 'app')
    outputDir = join(process.cwd(), config.outputDir || 'public')
    for (let fileGroup in config.files) {
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
      for (let file of glob(fileGroup, {cwd: inputDir})) {
        files[file] = {renderers}
      }
    }
  })
}

var glug = {}

glug.watch = function () {
  return new Promise((resolve, reject) => {
    print('watching')
    readConfig()
      .then(config => render(config))
      .catch(handleErr)
  })
}

glug.build = function () {
  return new Promise((resolve, reject) => {
    print('building')
    readConfig()
      .then(config => render(config))
      .catch(handleErr)
  })
}

// if called directly

if (require.main === module) {
  require('./cli')(glug, process.argv)
}

module.exports = glug
