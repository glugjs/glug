import chalk from './chalk'
import spinner from './elegant-spinner'
import symbols from './log-symbols'
import files from './read-config'

console.log(files)
console.log(symbols)
console.log(chalk)
console.log(spinner)

const last = function (array) {
  return array[array.length - 1]
}

const isLast = function (item, array) {
  return last(array) === item
}

const input = 'glug watch'

var currentPrompt = -1
var currentChar = 0

const terminal = document.getElementById('contents')
terminal.innerHTML = ''
var termContents = []

const print = function (string) {
  termContents[termContents.length - 1] += string
  terminal.innerHTML = termContents.join('\n')
}

var lastOutput = ''
const replaceLastOutput = function (string) {
  if (lastOutput !== string) {
    termContents.pop()
    termContents.push(string)
    terminal.innerHTML = termContents.join('\n')
    lastOutput = string
  }
}

const nextChar = function () {
  var newChar = input[currentChar]
  print(newChar)
  if (!isLast(newChar, input)) {
    currentChar++
  } else {
    state = 'output'
    termContents.push('')
    setInterval(updateTransformers, 350)
  }
}

var currentFrames = 0
const showOutput = function () {
  currentFrames++
  var output = typings[currentPrompt].output()
  if (currentFrames > typings[currentPrompt].frames) {
    currentFrames = 0
  }
  replaceLastOutput(output)
}

var state = 'input'

currentChar = 0
termContents.push('$ ')

const updateTerm = function () {
  if (state === 'input') {
    nextChar()
  } else if (state === 'output') {
    updateOutput()
  }
}

const updateTransformers = function () {
  for (let filename in files) {
    let file = files[filename]
    if (file.state !== 'completed') {
      file.current = file.current + 1 || 0
      if (file.current > file.renderers.length - 1) {
        file.current = -1
        file.state = 'completed'
      }
    }
  }
}

setInterval(updateTerm, 150)

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
      icon = green(file.spinner())
    } else if (file.state === 'error') {
      icon = symbols.error
    } else {
      icon = chalk.blue(file.spinner())
    }

    let renderers = chalk.gray(file.renderers
      .map(renderer => {
        if (renderer === file.renderers[file.current]) {
          return chalk.cyan(chalk.underline(renderer))
        }
        return renderer
      })
      .join(` ${chalk.cyan('›')} `))

    let string = `${icon} ${chalk.bold(filename)} ${renderers}`

    if (file.state === 'error' && file.error) {
      string += file.error
    }

    return string
  }).join('\n')
  replaceLastOutput(string)
}
