#!/usr/bin/env node

require('coffee-script/register')
var glug = require('./glug.coffee')
var program = require('commander')

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
    .action(function() {
      glug.init(arguments[0], arguments[1].verbose)
    })

  commands.watch
    .description('start a server')
    .option('-v, --verbose', 'print more output')
    .alias('w')
    .action(function() {
      glug.watch(arguments[1].verbose)
    })

  commands.build
    .description('build the project')
    .option('-v, --verbose', 'print more output')
    .alias('b')
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
