const lodash = require("lodash");

 const hasToSkip = (skipWords, skipIfMatch, value) => {
  return (
    skipWords?.has?.(value) ||
    lodash.find(skipIfMatch, function (aPattern) {
      return value.match(aPattern);
    })
  );
};

 const isValidSentence = (str) => {
  const trimmed = str.trim();

  // Basic checks
  if (trimmed.length === 0) return false;

  const startsWithCapital = /^[A-Z]/.test(trimmed);
  const endsWithPunctuation = /[.!?]$/.test(trimmed);
  const hasWords = /\b\w+\b/.test(trimmed);

  return startsWithCapital && endsWithPunctuation && hasWords;
}

 function skipWordIfMatch(options, word) {
  if (word.length < options.minLength) return false;
  if (
    lodash.find(options.skipWordIfMatch, function (aPattern) {
      return word.match(aPattern);
    })
  ) {
    return false;
  }
  return true;
}

function shouldSkipSuggestion(options, suggestion) {
  const {word} = suggestion;
  const result = hasToSkip(options.dictionary, options.skipIfMatch, word.toLowerCase());

  return result;
}

module.exports = {
  hasToSkip,
  isValidSentence,
  skipWordIfMatch,
  shouldSkipSuggestion
};

