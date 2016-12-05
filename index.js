#!/usr/bin/env node

require('coffee-script/register')
var glug = require('./glug.coffee')

module.exports = glug

var commands = {
  init: program.command('init <directory>'),
  watch: program.command('watch [directory]'),
  build: program.command('build [directory]')
}

// if called directly
if (require.main === module) {

  commands.init
    .description('set up a new project')
    .option('-v, --verbose', 'print more output')
    .alias('new')
    .action(glug.init)

  commands.watch
    .description('start a server')
    .option('-v, --verbose', 'print more output')
    .alias('server')
    .action(function() {
      glug.watch(arguments[1].verbose)
    })

  commands.build
    .description('build the project')
    .option('-v, --verbose', 'print more output')
    .alias('compile')
    .action(function() {
      glug.build(arguments[1].verbose)
    })

  program
    .version('0.0.14')
    .parse(process.argv)

  if (!process.argv.slice(2).length) {
    program.outputHelp()
  }

}
