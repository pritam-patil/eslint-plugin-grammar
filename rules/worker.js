// worker.js
var { runAsWorker } = require('synckit')
var gramma = require('gramma');
runAsWorker(
  // write async function
  async function(args) {
    // do expensive work
    const result = await gramma.check("this are apple")
    
    return {
      suggestions: result.matches,
      status: result.matches.length > 0 ? 'error' : 'ok'
    };
    // return result.map(item => ({
    //   word: item.word,
    //   suggestions: item.suggestions
    // }));
  }
)

