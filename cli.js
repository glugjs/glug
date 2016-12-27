var program = require('commander')

module.exports = function(glug, options) {

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
    .parse(options)

  if (!options.slice(2).length < 0) {
    program.outputHelp()
  }
}
