var basePath = process.cwd()
require('app-module-path').addPath(`${basePath}/node_modules`)

var {recursive: merge} = require('merge')
var matter = require('gray-matter')
var path = require('path')
var fs = require('graceful-fs')
var mkdirp = require('mkdirp')
var chalk = require('chalk')
var jstransformer = require('jstransformer')

var options
var locals
var inputDir
var outputDir
var currentTransformer
var jstransformers = {}

var print = function () {
  var args = Array.prototype.slice.call(arguments)
  process.send({print: args.join('')})
}

global.console.log = print
global.console.error = print

var handleErr = function (error) {
  if (error) {
    process.send({error: chalk.red(`
${chalk.bold(`Error from ${currentTransformer}`)}
${error.stack}`)})
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

var render = function (file, contents, transforms) {
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
    var command
    var parameters
    if (transformer.can('renderAsync')) {
      command = 'renderAsync'
      parameters = [
        contents,
        options[transform] || {},
        locals
      ]
    } else {
      command = 'renderFileAsync'
      parameters = [
        path.join(inputDir, file),
        options[transform] || {},
        locals
      ]
    }
    transformer[command](...parameters)
      .then(contents => {
        if (transforms.length > 0) {
          return render(file, contents.body, transforms)
        }
        return contents
      })
      .then(res => {
        resolve(res)
      })
      .catch(handleErr)
  })
}

process.on('message', data => {
  inputDir = data.inputDir
  outputDir = data.outputDir
  // eslint-disable-next-line import/no-dynamic-require
  let config = require(data.rootConfigPath)
  options = config.transformers
  readFile(data.filename)
    .then(fileText => {
      var {content, data: frontmatter} = matter(fileText)
      locals = merge(config.locals, frontmatter)
      return render(
        data.filename, content, data.file.renderers)
    })
    .then(contents => {
      process.send('writing')
      return writeFile(data.file.outputPath, contents.body)
    })
    .then(() => process.send('done'))
    .catch(handleErr)
})
