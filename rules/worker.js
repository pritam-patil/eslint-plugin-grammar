// worker.js
var { runAsWorker } = require("synckit");
var gramma = require("gramma");
var { shouldSkipSuggestion } = require("./utils/utils");

runAsWorker(async function (args, options) {
  const result = await gramma.check(args, {
    ...options,
    dictionary: [...options.dictionary],
  });

  return {
    suggestions: result.matches
      .filter((match) => !shouldSkipSuggestion(options, match))
      .filter((match) => match.rule.confidence >= options.confidence),
    status: result.matches.length > 0 ? "error" : "ok",
  };
});
