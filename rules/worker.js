// worker.js
var { runAsWorker } = require("synckit");
var grammarChecker = require("gramma-lite");
var { shouldSkipSuggestion } = require("./utils/utils");

runAsWorker(async function (args, options) {
  const result = await grammarChecker(args, {
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
