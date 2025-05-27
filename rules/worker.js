// worker.js
var { runAsWorker } = require('synckit')

runAsWorker(
  // write async function
  async function(args) {
    // do expensive work
    setTimeout(() => {
      console.log('runAsWorker', args)
    }, 1000)
  }
)

