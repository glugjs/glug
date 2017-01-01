const spinner = function (frames) {
  var i = 0
  var frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
	return function () {
    return frames[i = ++i % frames.length]
	}
}

const red = (string) => `<span class='red'>${string}</span>`
const blue = (string) => `<span class='blue'>${string}</span>`
const green = (string) => `<span class='green'>${string}</span>`
const yellow = (string) => `<span class='yellow'>${string}</span>`
const gray = (string) => `<span class='gray'>${string}</span>`
const cyan = (string) => `<span class='cyan'>${string}</span>`
const bold = (string) => `<span class='bold'>${string}</span>`
const underline = (string) => `<span class='underline'>${string}</span>`

const symbols = {
	info: blue('ℹ'),
	success: green('✔'),
	warning: yellow('⚠'),
	error: red('✖')
}

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

const replaceLastOutput = function (string) {
  termContents.pop()
  termContents.push(string)
  terminal.innerHTML = termContents.join('\n')
}

const nextChar = function () {
  var newChar = input[currentChar]
  print(newChar)
  if (!isLast(newChar, input)) {
    currentChar++
  } else {
    state = 'output'
    termContents.push('')
    setInterval(updateTransformers, 500)
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

files = {
  'index.js': {
    renderers: ['babel', 'browserify']
  },
  'foo.js': {
    renderers: ['babel', 'browserify']
  },
  'index.pug': {
    renderers: ['pug', 'html-minifier']
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
      icon = blue(file.spinner())
    }

    let renderers = gray(file.renderers
      .map(renderer => {
        if (renderer === file.renderers[file.current]) {
          return cyan(underline(renderer))
        }
        return renderer
      })
      .join(` ${cyan('›')} `))

    let string = `${icon} ${bold(filename)} ${renderers}`

    if (file.state === 'error' && file.error) {
      string += file.error
    }

    return string
  }).join('\n')
  replaceLastOutput(string)
}
