const fs = require("fs");
const path = require("path");
const lodash = require("lodash");
const Spellchecker = require("hunspell-spellchecker");
const globals = require("globals");
const defaultSettings = require("./defaultSettings");
const { createSyncFn } = require("synckit");
const { hasToSkip, isValidSentence, skipWordIfMatch } = require("./utils/utils");

const spell = new Spellchecker();
const grammarChecker = createSyncFn(require.resolve("./worker"));
const defaultOptions = {
  langDir: defaultSettings.langDir,
  comments: true,
  strings: true,
  sentences: false,
  debug: false,
  identifiers: true,
  templates: true,
  skipWords: [],
  skipIfMatch: [],
  skipWordIfMatch: [],
  minLength: 1,
};

let dictionary = null,
  dictionaryLang,
  skipWords = lodash.union(
    ...getGloabalsSkipsWords(),
    defaultSettings.skipWords,
    Object.getOwnPropertyNames(String.prototype),
    Object.getOwnPropertyNames(JSON),
    Object.getOwnPropertyNames(Math)
  );

function getGloabalsSkipsWords() {
  return lodash.keys(globals).map(function (each) {
    return lodash.keys(globals[each]);
  });
}

const create = {
  create(context) {
    const options = lodash.assign(defaultOptions, context.options[0]);
    const lang = options.lang || "en_US";

    function initializeDictionary(language) {
      dictionary = spell.parse({
        aff: fs.readFileSync(path.join(options.langDir, language + ".aff")),
        dic: fs.readFileSync(path.join(options.langDir, language + ".dic")),
      });

      spell.use(dictionary);
    }

    if (dictionaryLang !== lang) {
      //Dictionary will only be initialized if changed
      dictionaryLang = lang;
      initializeDictionary(lang);
    }

    options.skipWords = new Set(
      lodash.union(options.skipWords, skipWords).map(function (string) {
        return string.toLowerCase();
      })
    );

    options.skipIfMatch = lodash.union(
      options.skipIfMatch,
      defaultSettings.skipIfMatch
    );

    const isSpellingError = (aWord) => {
      return !options.skipWords?.has?.(aWord) && !spell.check(aWord);
    };

    /**
     * returns false if the word has to be skipped
     * @param  {string}  word
     * @return {Boolean} false if skip; true if not
     */
    function hasToSkipWord(word) {
      return skipWordIfMatch(options, word);
    }

    const generateGrammarSuggestion = (match, value) => {
      const { offset, length, replacements = [] } = match;
      const valueLen = value.length;
      const word = replacements[0].value;

      const newValue =
        value.slice(0, offset) + word + value.slice(offset + length, valueLen);

      return newValue;
    };

    function checkComment(aNode) {
      if (options.comments) {
        underscoreParser(aNode, aNode.value, "Comment");
      }
    }

    const checkGrammar = (aNode, value, spellingType) => {
      const isSentence = isValidSentence(value);

      if (!isSentence) {
        return false;
      }

      if (options.debug) {
        console.info("checkGrammar", value, isSentence);
      }

      const trimmed = value.trim();

      const grammarOptions = {
        language: options.lang.replace("_", "-"), // translate from en_US to en-US
        dictionary: options.skipWords,
        skipIfMatch: options.skipIfMatch
      };

      const { status, suggestions } = grammarChecker(trimmed, grammarOptions);
      if (suggestions.length > 0) {
        if (options.debug) {
          console.info(`Found ${suggestions.length} suggestions`);
        }
        suggestions.map((item) => {
          const suggestion = generateGrammarSuggestion(item, trimmed);
          context.report(
            aNode,
            'You have a grammar error in "{{word}}". Hint: {{hint}}. Suggestion: {{suggestion}}',
            {
              word: trimmed,
              hint: item.shortMessage,
              suggestion,
            }
          );
        });
      }
    };

    const underscoreParser = (aNode, value, spellingType) => {
      if (options.sentences) {
        checkGrammar(aNode, value, `Sentence: ${spellingType}`);
      }

      if (!options.enableUpperCaseUnderscoreCheck) {
        checkSpelling(aNode, value, spellingType);
      } else {
        const splitValues = value.split("_");
        splitValues.forEach((word) => {
          checkSpelling(aNode, word.toLowerCase(), spellingType);
        });
      }
    };

    const checkSpelling = (aNode, value, spellingType) => {
      if (!hasToSkip(options.skipWords, options.skipIfMatch, value)) {
        // Regular expression matches regexp metacharacters, and any special char
        var regexp =
            /(\\[sSwdDB0nfrtv])|\\[0-7][0-7][0-7]|\\x[0-9A-F][0-9A-F]|\\u[0-9A-F][0-9A-F][0-9A-F][0-9A-F]|[^0-9a-zA-Z '’]/g,
          nodeWords = value
            .replace(regexp, " ")
            .replace(/([A-Z])/g, " $1")
            .split(" "),
          errors;
        errors = nodeWords
          .filter(hasToSkipWord)
          .filter(isSpellingError)
          .filter(function (aWord) {
            // Split words by numbers for special cases such as test12anything78variable and to include 2nd and 3rd ordinals
            // also for Proper names we convert to lower case in second pass.
            var splitByNumberWords = aWord
              .replace(/[0-9']/g, " ")
              .replace(/([A-Z])/g, " $1")
              .toLowerCase()
              .split(" ");
            return splitByNumberWords.some(isSpellingError);
          })
          .forEach(function (aWord) {
            context.report(
              aNode,
              "You have a misspelled word: {{word}} on {{spellingType}}",
              {
                word: aWord,
                spellingType: spellingType,
              }
            );
          });
      }
    };

    function isInImportDeclaration(aNode) {
      // @see https://buildmedia.readthedocs.org/media/pdf/esprima/latest/esprima.pdf
      return (
        aNode.parent &&
        (aNode.parent.type === "ImportDeclaration" ||
          aNode.parent.type === "ExportDeclaration" ||
          (options.ignoreRequire &&
            aNode.parent.type === "CallExpression" &&
            aNode.parent.callee.name === "require"))
      );
    }

    const checkTemplateElement = () => {
      if (
        options.templates &&
        typeof aNode.value.raw === "string" &&
        !isInImportDeclaration(aNode)
      ) {
        underscoreParser(aNode, aNode.value.raw, "Template");
      }
    };

    const checkLiteral = (aNode) => {
      if (
        options.strings &&
        typeof aNode.value === "string" &&
        !isInImportDeclaration(aNode)
      ) {
        underscoreParser(aNode, aNode.value, "String");
      }
    };

    const checkIdentifier = (aNode) => {
      if (options.identifiers) {
        underscoreParser(aNode, aNode.name, "Identifier");
      }
    };

    return {
      // Noop in ESLint 4+
      BlockComment: checkComment,
      // Noop in ESLint 4+
      LineComment: checkComment,
      Literal: checkLiteral,
      TemplateElement: checkTemplateElement,
      Identifier: checkIdentifier,
    };
  },
};

module.exports = create;
