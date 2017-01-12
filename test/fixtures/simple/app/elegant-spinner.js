export default function (frames) {
  var i = 0
  var frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  return function () {
    return frames[i = ++i % frames.length]
  }
}

