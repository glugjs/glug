import config from './config'
import glob from './glob'

var files = {}

var readConfig = function () {
  for (let fileGroup in config.files) {
    if ({}.hasOwnProperty.call(config.files, fileGroup)) {
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

      let matchedFiles = glob(fileGroup, {cwd: config.inputDir})

      for (let i in matchedFiles) {
        let file = matchedFiles[i]
        files[file] = {
          renderers,
          inputPath: file
        }
      }
    }
  }
}

readConfig()

export default files
