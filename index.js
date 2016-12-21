#!/usr/bin/env node

var base_path = process.cwd()
require('app-module-path').addPath(`${base_path}/node_modules`)
var fs = require('graceful-fs')
var path = require('path')
var { fork } = require('child_process')
var program = require('commander')
var logUpdate = require('log-update')
var symbols = require('log-symbols')
var Hjson = require('hjson')
var chalk = require('chalk')
var figures = require('figures')
var spinner = require('elegant-spinner')
var { sleep } = require('sleep')
var { recursive: merge } = require('merge')

var json = function (data) {
  return JSON.stringify(data, null, 2)
}

var workers = []
var openWorkers = []
var currentFiles = {}

setInterval(function () {
  var string = Object.keys(currentFiles).map(filename => {
    var file = currentFiles[filename]
    var char
    if (!file.spinner) {
      file.spinner = spinner()
    }
    if (file.state === 'started') {
      char = chalk.blue(file.spinner())
    } else if (file.state === 'completed') {
      char = symbols.success
    }
    renderers = chalk.gray(file.renderers.join(chalk.cyan(figures(' › '))))
    return `${char} ${chalk.bold(filename)} ${renderers}`
  }).join('\n')
  logUpdate(string)
}, 70)

var handleErr = function (error) {
  if (error) {
    if (error.stack) {
      error = error.stack
    }
    throw error
  }
}

var getWorker = function () {
  return new Promise((resolve, reject) => {
    if (openWorkers[0]) {
      return resolve(workers[openWorker[0]])
    }
    var newWorker = fork(path.join(__dirname, 'render-file'))
    workers.push(newWorker)
    return resolve(newWorker)
  })
}
var renderFile = function (file) {
  currentFiles[file] = {state: 'started'}
  currentFiles[file].renderers = ['stylus', 'autoprefixer', 'csso', 'clean-css']
  getWorker()
    .then(worker => {
      worker.send({file, data: currentFiles[file]})
      worker.on('message', message => {
        if (message === 'done') {
          currentFiles[file].state = 'completed'
        }
      })
    })
    .catch(handleErr)
}

var render = function () {
  return new Promise((resolve, reject) => {
    renderFile('index.js')
    renderFile('foo.js')
    renderFile('index.ts')
    renderFile('index.html')
    renderFile('logo.svg')
  })
}

var readConfig = function () {
  return new Promise((resolve, reject) =>
    fs.readFile('config.hjson', 'utf-8', (err, data) => {
      if (err) {
        return reject(err)
      }
      data = Hjson.parse(data)
      resolve(data)
    })
  ).then(data => {
    console.log(data)
  })
}

var glug = {}

glug.watch = function () {
  return new Promise((resolve, reject) => {
    console.log('watching')
    readConfig()
      .then(config => render(config))
      .catch(handleErr)
  })
}

glug.build = function () {
  return new Promise((resolve, reject) => {
    console.log('building')
    readConfig()
      .then(config => render(config))
      .catch(handleErr)
  })
}

module.exports = glug

// if called directly

if (require.main === module) {
  program.command('init <directory>')
    .description('set up a new project')
    .option('-v, --verbose', 'print more output')
    .action(glug.init)

  program.command('watch [directory]')
    .description('start a server')
    .option('-v, --verbose', 'print more output')
    .alias('w')
    .action(() => {
      glug.watch(arguments[1].verbose)
    })

  program.command('build [directory]')
    .description('build the project')
    .option('-v, --verbose', 'print more output')
    .alias('b')
    .action(() => {
      glug.build(arguments[1].verbose)
    })

  program
    .version('0.0.14')
    .parse(process.argv)

  if (!process.argv.slice(2).length < 0) {
    program.outputHelp()
  }
}
