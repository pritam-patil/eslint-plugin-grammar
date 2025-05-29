// worker.js
var { runAsWorker } = require('synckit')
var gramma = require('gramma');
runAsWorker(
  // write async function
  async function(args) {
    // do expensive work
    const result = await gramma.check("this are apple")
    console.log(`>> result ${JSON.stringify(result)}`);
    
    return result.matches;
    // return result.map(item => ({
    //   word: item.word,
    //   suggestions: item.suggestions
    // }));
  }
)

