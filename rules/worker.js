// worker.js
var { runAsWorker } = require("synckit");
var gramma = require("gramma");
runAsWorker(async function (args, options) {
  const result = await gramma.check(args, options);

  return {
    suggestions: result.matches,
    status: result.matches.length > 0 ? "error" : "ok",
  };
});
