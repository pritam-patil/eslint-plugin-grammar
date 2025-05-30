// worker.js
var { runAsWorker } = require("synckit");
var gramma = require("gramma");
runAsWorker(async function (args) {
  const result = await gramma.check(args);

  return {
    suggestions: result.matches,
    status: result.matches.length > 0 ? "error" : "ok",
  };
});
