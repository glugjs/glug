var sleep = require('sleep').sleep

var random = function (min = 0, max = 10) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

process.send('hi')
process.on('message', message => {
  sleep(random(0, 2))
  process.send('done')
})

