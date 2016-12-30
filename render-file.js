var basePath = process.cwd()
require('app-module-path').addPath(`${basePath}/node_modules`)

var path = require('path')
var fs = require('graceful-fs')
var mkdirp = require('mkdirp')
var chalk = require('chalk')
var jstransformer = require('jstransformer')

var inputDir
var outputDir
// var currentFile
var currentTransformer
var jstransformers = {}

// var print = function () {
//   var args = Array.prototype.slice.call(arguments)
//   process.send({print: `${currentFile}: ${args.join('')}`})
// }

var handleErr = function (error) {
  if (error) {
    process.send({error: chalk.red(`
${chalk.bold(`Error from ${currentTransformer}`)}
${error.message}`)})
  }
}

var readFile = function (filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(inputDir, filename), 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

var writeFile = function (filename, contents) {
  return new Promise((resolve, reject) => {
    let outPath = path.join(outputDir, filename)
    mkdirp(path.dirname(outPath), err => {
      if (err) {
        return reject(err)
      }
      fs.writeFile(outPath, contents, 'utf8', err => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  })
}

var render = function (file, contents, transforms, settings = {}) {
  return new Promise(resolve => {
    var transform = transforms.shift()
    currentTransformer = transform
    process.send({transformer: transform})
    if (!jstransformers[transform]) {
      jstransformers[transform] =
        // eslint-disable-next-line import/no-dynamic-require
        jstransformer(require(`jstransformer-${transform}`))
    }
    var transformer = jstransformers[transform]
    transformer.renderAsync(contents, settings)
      .catch(handleErr)
      .then(contents => {
        if (transforms.length > 0) {
          return render(file, contents.body, transforms)
        }
        return contents
      })
      .then(res => {
        resolve(res)
      })
  })
}

process.on('message', data => {
  inputDir = data.inputDir
  outputDir = data.outputDir
  // currentFile = data.filename
  readFile(data.filename)
    .then(contents => render(
      data.filename, contents, data.file.renderers))
    .then(contents => {
      process.send('writing')
      return writeFile(data.file.outputPath, contents.body)
    })
    .then(() => process.send('done'))
    .catch(handleErr)
})
