var base_path = process.cwd()
require('app-module-path').addPath(`${base_path}/node_modules`)

var path = require('path')
var fs = require('fs')
var { sleep } = require('sleep')
var lazyRequire = require('lazy-require')
var chalk = require('chalk')

var inputDir, outputDir

var print = function () {
  var args = Array.prototype.slice.call(arguments)
  process.send(`print:${args.join(' ')}`)
}

var lrequire = function (packageName) {
  // print(packageName)
  // var package = lazyRequire(packageName, {save: true})
  // if (package instanceof Error) {
  //   throw package.stack
  // }
  // return package
  return require(packageName)
}

var jstransformer = lrequire('jstransformer')

var readFile = function (filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(inputDir, filename), 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

var writeFile = function (filename, contents) {
  return new Promise((resolve, reject) => {
    let outPath = path.join(outputDir, filename)
    fs.writeFile(outPath, contents, 'utf8', (err) => {
      if (err) {
        return reject(err)
      } else {
        resolve()
      }
    })
  })
}

var render = function(file, contents, transforms, settings = {}) {
  return new Promise((resolve, reject) => {
    var transform = transforms.shift()
    process.send(`transformer:${transform}`)
    var transformer = jstransformer(
      lrequire(`jstransformer-${transform}`))
    transformer.renderAsync(contents, settings)
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

handleErr = function (error) {
  if (error) {
    print(chalk.red(error.message, null, 2))
  }
}

process.on('message', data => {
  inputDir = data.inputDir
  outputDir = data.outputDir
  readFile(data.filename)
    .then(contents => render(
      data.filename, contents, data.file.renderers))
    .then(contents => {
      process.send('writing')
      return writeFile(data.filename, contents.body)
    })
    .then(() => process.send('done'))
    .catch(handleErr)
})

