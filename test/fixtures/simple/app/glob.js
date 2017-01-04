allFiles = [
  'styles.styl',
  'app.js',
  'index.sml'
]

export default function (string) {
  var resultingFiles = []
  for (let i in allFiles) {
    let file = allFiles[i]
    if (string === file) {
      resultingFiles.push(file)
    }
  }
  return resultingFiles
}
