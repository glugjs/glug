import minimatch from './minimatch'

allFiles = [
  'styles.styl',
  'app.js',
  'index.sml'
]

export default function (string) {
  var resultingFiles = []
  for (let i in allFiles) {
    let file = allFiles[i]
    let matches = minimatch(file, string)
    console.log(`minimatch(${file}, ${string}): ${matches}`)
    if (matches) {
      resultingFiles.push(file)
    }
  }
  return resultingFiles
}
