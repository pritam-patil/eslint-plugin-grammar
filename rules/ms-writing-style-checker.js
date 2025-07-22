const writeGood = require('write-good');
const { isValidSentence, hasToSkip } = require('./utils/utils');

// Microsoft Writing Style Rules
const microsoftStyleRules = {
  // Avoid weak or hedge words
  weakWords: [
    'quite', 'very', 'really', 'just', 'simply', 'basically', 'actually',
    'literally', 'obviously', 'clearly', 'of course', 'certainly',
    'probably', 'maybe', 'perhaps', 'might', 'could', 'should',
    'would', 'seem', 'appear', 'tend to', 'in order to'
  ],

  // Prefer active voice indicators
  passiveVoiceIndicators: [
    'is being', 'was being', 'are being', 'were being', 'be being',
    'been being', 'will be being', 'would be being', 'should be being',
    'could be being', 'might be being', 'must be being'
  ],

  // Microsoft-specific terminology preferences
  terminology: {
    'login': 'sign in',
    'logout': 'sign out',
    'username': 'user name',
    'email': 'email address',
    'setup': 'set up',
    'backup': 'back up',
    'popup': 'pop-up',
    'dropdown': 'drop-down',
    'checkbox': 'check box',
    'website': 'web site',
    'web page': 'webpage',
    'click on': 'click',
    'press on': 'press',
    'right-click on': 'right-click',
    'double-click on': 'double-click'
  },

  // Contractions to avoid in formal documentation
  contractions: [
    "don't", "won't", "can't", "shouldn't", "wouldn't", "couldn't",
    "didn't", "doesn't", "hasn't", "haven't", "isn't", "aren't",
    "wasn't", "weren't", "you're", "they're", "we're", "it's",
    "that's", "here's", "there's", "what's", "who's", "how's"
  ],

  // Prohibited words/phrases
  prohibited: [
    'simply', 'just', 'easy', 'obviously', 'of course', 'clearly',
    'please note', 'please be aware', 'it should be noted',
    'kill', 'hang', 'execute', 'abort', 'terminate'
  ],

  // Gender-neutral alternatives
  genderNeutral: {
    'he/she': 'they',
    'his/her': 'their',
    'him/her': 'them',
    'himself/herself': 'themselves',
    'guys': 'everyone',
    'manpower': 'workforce',
    'man-hours': 'person-hours',
    'mankind': 'humanity'
  }
};

class MicrosoftStyleChecker {
  constructor(options = {}) {
    this.options = {
      checkWeakWords: true,
      checkPassiveVoice: true,
      checkTerminology: true,
      checkContractions: true,
      checkProhibited: true,
      checkGenderNeutral: true,
      checkReadability: true,
      ...options
    };
  }

  // Main checking function
  checkText(text, context = {}) {
    const issues = [];
    let workingText = text;
    const allReplacements = [];
    
    if (this.options.checkWeakWords) {
      const weakWordIssues = this.checkWeakWords(workingText);
      issues.push(...weakWordIssues);
      allReplacements.push(...weakWordIssues.filter(issue => issue.replacement !== undefined));
    }
    
    if (this.options.checkTerminology) {
      const terminologyIssues = this.checkTerminology(workingText);
      issues.push(...terminologyIssues);
      allReplacements.push(...terminologyIssues.filter(issue => issue.replacement !== undefined));
    }
    
    if (this.options.checkContractions) {
      const contractionIssues = this.checkContractions(workingText);
      issues.push(...contractionIssues);
      allReplacements.push(...contractionIssues.filter(issue => issue.replacement !== undefined));
    }
    
    if (this.options.checkGenderNeutral) {
      const genderIssues = this.checkGenderNeutral(workingText);
      issues.push(...genderIssues);
      allReplacements.push(...genderIssues.filter(issue => issue.replacement !== undefined));
    }
    
    if (this.options.checkProhibited) {
      const prohibitedIssues = this.checkProhibited(workingText);
      issues.push(...prohibitedIssues);
      allReplacements.push(...prohibitedIssues.filter(issue => issue.replacement !== undefined));
    }
    
    if (this.options.checkPassiveVoice) {
      issues.push(...this.checkPassiveVoice(workingText));
    }
    
    if (this.options.checkReadability) {
      issues.push(...this.checkReadability(workingText));
    }

    // Generate corrected text and sentence-level replacements
    const correctedText = this.applySuggestions(text, allReplacements);
    const sentenceReplacements = this.generateSentenceReplacements(text, correctedText);

    // Add the final corrected text to the result
    const result = {
      issues,
      correctedText: correctedText !== text ? correctedText : null,
      originalText: text,
      sentenceReplacements: sentenceReplacements
    };

    return result;
  }

  // Generate sentence-level replacements with proper offsets
  generateSentenceReplacements(originalText, correctedText) {
    if (!correctedText || originalText === correctedText) {
      return [];
    }

    // Split text into sentences for more granular replacements
    const sentences = this.splitIntoSentences(originalText);
    const correctedSentences = this.splitIntoSentences(correctedText);
    const replacements = [];
    
    let originalOffset = 0;
    let correctedOffset = 0;
    
    for (let i = 0; i < Math.max(sentences.length, correctedSentences.length); i++) {
      const originalSentence = sentences[i] || '';
      const correctedSentence = correctedSentences[i] || '';
      
      if (originalSentence !== correctedSentence) {
        replacements.push({
          type: 'sentence-correction',
          originalText: originalSentence,
          correctedText: correctedSentence,
          start: originalOffset,
          end: originalOffset + originalSentence.length,
          message: `Sentence correction: "${originalSentence}" → "${correctedSentence}"`
        });
      }
      
      originalOffset += originalSentence.length;
      correctedOffset += correctedSentence.length;
    }
    
    // If sentence splitting doesn't work well, provide a full-text replacement
    if (replacements.length === 0) {
      replacements.push({
        type: 'full-text-correction',
        originalText: originalText,
        correctedText: correctedText,
        start: 0,
        end: originalText.length,
        message: `Full text correction: "${originalText}" → "${correctedText}"`
      });
    }
    
    return replacements;
  }

  // Split text into sentences
  splitIntoSentences(text) {
    // Simple sentence splitting - can be enhanced with a more sophisticated library
    return text.split(/(?<=[.!?])\s+/).filter(sentence => sentence.length > 0);
  }

  // Apply suggestions to text
  applySuggestions(text, issues) {
    let correctedText = text;
    
    // Sort issues by position (descending) to avoid offset issues
    const sortedIssues = issues
      .filter(issue => issue.replacement !== undefined && issue.replacement !== null)
      .sort((a, b) => b.start - a.start);
    
    sortedIssues.forEach(issue => {
      const beforeText = correctedText.slice(0, issue.start);
      const afterText = correctedText.slice(issue.end);
      let replacement = issue.replacement;
      
      // Handle spacing for removed words (empty replacement)
      if (replacement === '') {
        const beforeChar = issue.start > 0 ? correctedText[issue.start - 1] : '';
        const afterChar = issue.end < correctedText.length ? correctedText[issue.end] : '';
        
        // If removing a word that's surrounded by spaces, keep one space
        if (beforeChar === ' ' && afterChar === ' ') {
          replacement = ' ';
        }
        // If removing a word at the start that's followed by a space, remove the space too
        else if (beforeChar === '' && afterChar === ' ') {
          correctedText = beforeText + replacement + afterText.slice(1);
          return;
        }
        // If removing a word preceded by a space and followed by punctuation, remove the space
        else if (beforeChar === ' ' && /[.,!?;:]/.test(afterChar)) {
          correctedText = beforeText.slice(0, -1) + replacement + afterText;
          return;
        }
      }
      
      correctedText = beforeText + replacement + afterText;
    });
    
    // Clean up any double spaces that might have been created
    correctedText = correctedText.replace(/\s+/g, ' ').trim();
    
    return correctedText;
  }

  checkWeakWords(text) {
    const issues = [];
    
    microsoftStyleRules.weakWords.forEach(weakWord => {
      const regex = new RegExp(`\\b${weakWord}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          type: 'weak-word',
          message: `Avoid weak word "${match[0]}". Be more specific and direct.`,
          start: match.index,
          end: match.index + match[0].length,
          severity: 'warning',
          suggestion: 'Consider removing or replacing with more specific language',
          replacement: this.getWeakWordReplacement(match[0], text, match.index)
        });
      }
    });
    
    return issues;
  }

  getWeakWordReplacement(weakWord, text, position) {
    const word = weakWord.toLowerCase();
    
    // For many weak words, the best solution is removal
    const removableWords = ['quite', 'very', 'really', 'just', 'simply', 'basically', 'actually', 'literally', 'obviously', 'clearly', 'of course', 'certainly'];
    
    if (removableWords.includes(word)) {
      return ''; // Empty string for removal
    }
    
    // For hedge words, provide alternatives
    const alternatives = {
      'probably': 'likely',
      'maybe': 'perhaps',
      'might': 'may',
      'could': 'can',
      'would': 'will',
      'seem': 'appear',
      'appear': 'are',
      'tend to': 'typically',
      'in order to': 'to'
    };
    
    return alternatives[word] || ''; // Return alternative or empty string
  }

  checkPassiveVoice(text) {
    const issues = [];
    
    // Use write-good for passive voice detection
    const writeGoodSuggestions = writeGood(text, { passive: true });
    
    writeGoodSuggestions.forEach(suggestion => {
      if (suggestion.reason.includes('passive voice')) {
        issues.push({
          type: 'passive-voice',
          message: 'Use active voice instead of passive voice for clearer communication.',
          start: suggestion.index,
          end: suggestion.index + suggestion.offset,
          severity: 'warning',
          suggestion: 'Rewrite in active voice',
          replacement: undefined // Passive voice requires manual rewriting
        });
      }
    });
    
    return issues;
  }

  checkTerminology(text) {
    const issues = [];
    
    Object.entries(microsoftStyleRules.terminology).forEach(([incorrect, correct]) => {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          type: 'terminology',
          message: `Use "${correct}" instead of "${match[0]}" per Microsoft style guidelines.`,
          start: match.index,
          end: match.index + match[0].length,
          severity: 'error',
          suggestion: correct,
          replacement: correct
        });
      }
    });
    
    return issues;
  }

  checkContractions(text) {
    const issues = [];
    
    microsoftStyleRules.contractions.forEach(contraction => {
      const regex = new RegExp(`\\b${contraction}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const expanded = this.expandContraction(match[0]);
        issues.push({
          type: 'contraction',
          message: `Avoid contractions in formal documentation. Use "${expanded}" instead of "${match[0]}".`,
          start: match.index,
          end: match.index + match[0].length,
          severity: 'warning',
          suggestion: expanded,
          replacement: expanded
        });
      }
    });
    
    return issues;
  }

  checkProhibited(text) {
    const issues = [];
    
    microsoftStyleRules.prohibited.forEach(prohibited => {
      const regex = new RegExp(`\\b${prohibited}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const replacement = this.getProhibitedReplacement(match[0], text, match.index);
        issues.push({
          type: 'prohibited',
          message: `Avoid using "${match[0]}" in Microsoft documentation.`,
          start: match.index,
          end: match.index + match[0].length,
          severity: 'error',
          suggestion: this.getProhibitedAlternative(match[0]),
          replacement: replacement
        });
      }
    });
    
    return issues;
  }

  checkGenderNeutral(text) {
    const issues = [];
    
    Object.entries(microsoftStyleRules.genderNeutral).forEach(([gendered, neutral]) => {
      const regex = new RegExp(`\\b${gendered}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          type: 'gender-neutral',
          message: `Use gender-neutral language. Replace "${match[0]}" with "${neutral}".`,
          start: match.index,
          end: match.index + match[0].length,
          severity: 'warning',
          suggestion: neutral,
          replacement: neutral
        });
      }
    });
    
    return issues;
  }

  checkReadability(text) {
    const issues = [];
    
    // Use write-good for readability checks
    const writeGoodSuggestions = writeGood(text, {
      weasel: true,
      illusion: true,
      so: true,
      thereIs: true,
      adverb: true,
      tooWordy: true
    });
    
    writeGoodSuggestions.forEach(suggestion => {
      issues.push({
        type: 'readability',
        message: `Readability issue: ${suggestion.reason}`,
        start: suggestion.index,
        end: suggestion.index + suggestion.offset,
        severity: 'info',
        suggestion: 'Consider revising for clarity',
        replacement: undefined // Readability issues require manual revision
      });
    });
    
    return issues;
  }

  expandContraction(contraction) {
    const expansions = {
      "don't": "do not",
      "won't": "will not",
      "can't": "cannot",
      "shouldn't": "should not",
      "wouldn't": "would not",
      "couldn't": "could not",
      "didn't": "did not",
      "doesn't": "does not",
      "hasn't": "has not",
      "haven't": "have not",
      "isn't": "is not",
      "aren't": "are not",
      "wasn't": "was not",
      "weren't": "were not",
      "you're": "you are",
      "they're": "they are",
      "we're": "we are",
      "it's": "it is",
      "that's": "that is",
      "here's": "here is",
      "there's": "there is",
      "what's": "what is",
      "who's": "who is",
      "how's": "how is"
    };
    
    return expansions[contraction.toLowerCase()] || contraction;
  }

  getProhibitedAlternative(word) {
    const alternatives = {
      'simply': 'Remove or be more specific',
      'just': 'Remove or be more specific',
      'easy': 'straightforward',
      'obviously': 'Remove',
      'of course': 'Remove',
      'clearly': 'Remove',
      'please note': 'Remove',
      'please be aware': 'Remove',
      'it should be noted': 'Remove',
      'kill': 'stop, end, or close',
      'hang': 'stop responding',
      'execute': 'run',
      'abort': 'cancel',
      'terminate': 'end'
    };
    
    return alternatives[word.toLowerCase()] || 'Find alternative phrasing';
  }

  getProhibitedReplacement(word, text, position) {
    const wordLower = word.toLowerCase();
    
    // Words that should be completely removed
    const removableWords = ['simply', 'just', 'obviously', 'of course', 'clearly', 'please note', 'please be aware', 'it should be noted'];
    
    if (removableWords.includes(wordLower)) {
      return ''; // Empty string for removal
    }
    
    // Words with direct replacements
    const directReplacements = {
      'easy': 'straightforward',
      'kill': 'stop',
      'hang': 'freeze',
      'execute': 'run',
      'abort': 'cancel',
      'terminate': 'end'
    };
    
    return directReplacements[wordLower] || ''; // Return replacement or empty string
  }
}

// ESLint rule implementation
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Microsoft writing style guidelines',
      category: 'Style',
      recommended: false
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          checkWeakWords: { type: 'boolean' },
          checkPassiveVoice: { type: 'boolean' },
          checkTerminology: { type: 'boolean' },
          checkContractions: { type: 'boolean' },
          checkProhibited: { type: 'boolean' },
          checkGenderNeutral: { type: 'boolean' },
          checkReadability: { type: 'boolean' },
          strings: { type: 'boolean' },
          comments: { type: 'boolean' },
          sentences: { type: 'boolean' },
          debug: { type: 'boolean' },
          templates: { type: 'boolean' },
          skipWords: { type: 'array', items: { type: 'string' } },
          skipIfMatch: { type: 'array', items: { type: 'string' } },
          skipWordIfMatch: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const checker = new MicrosoftStyleChecker(options);

    function checkLiteral(node) {
      if ((!options.strings || !options.sentences) && !node.value || typeof node.value !== 'string') return;

      if (options.sentences && !isValidSentence(node.value)) return;

      if (hasToSkip([], ["\\w+-{1}"], node.value)) {
        console.log("Skipping", node.value);
        return
      };
      
      const result = checker.checkText(node.value?.trim());
      console.log(result);
    }
    
    function checkNode(node) {
      if (!node.value || typeof node.value !== 'string') return;
      
      const result = checker.checkText(node.value);
      const sourceCode = context.getSourceCode();
      const nodeStart = node.range[0];
      
      // Report individual word-level issues with available fixes
      result.issues.forEach(issue => {
        const hasReplacement = issue.replacement !== undefined && issue.replacement !== null;
        
        context.report({
          node,
          message: issue.message,
          loc: {
            start: sourceCode.getLocFromIndex(nodeStart + issue.start),
            end: sourceCode.getLocFromIndex(nodeStart + issue.end)
          },
          fix: hasReplacement ? 
            (fixer) => fixer.replaceTextRange(
              [nodeStart + issue.start, nodeStart + issue.end],
              issue.replacement
            ) : null
        });
      });

      // Report sentence-level replacements with proper offsets
      if (result.sentenceReplacements && result.sentenceReplacements.length > 0) {
        result.sentenceReplacements.forEach(replacement => {
          context.report({
            node,
            message: replacement.message,
            loc: {
              start: sourceCode.getLocFromIndex(nodeStart + replacement.start),
              end: sourceCode.getLocFromIndex(nodeStart + replacement.end)
            },
            fix: (fixer) => {
              if (replacement.type === 'full-text-correction') {
                // For full text replacement, preserve the quotes if it's a string literal
                if (node.type === 'Literal' && typeof node.value === 'string') {
                  const quote = node.raw[0]; // Get the original quote character
                  return fixer.replaceText(node, `${quote}${replacement.correctedText}${quote}`);
                }
                return fixer.replaceText(node, replacement.correctedText);
              } else {
                // For sentence-level replacements, replace the specific range
                return fixer.replaceTextRange(
                  [nodeStart + replacement.start, nodeStart + replacement.end],
                  replacement.correctedText
                );
              }
            }
          });
        });
      }
    }

    return {
      Literal: checkLiteral,
      TemplateElement: checkNode,
      JSXText: checkNode,
      Program(node) {
        if (!options.comments) return;

        // Check comments as well
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getAllComments();
        
        comments.forEach(comment => {
          const result = checker.checkText(comment.value);
          
          // Report individual word-level issues
          result.issues.forEach(issue => {
            const hasReplacement = issue.replacement !== undefined && issue.replacement !== null;
            
            context.report({
              node: comment,
              message: issue.message,
              loc: {
                start: sourceCode.getLocFromIndex(comment.range[0] + issue.start),
                end: sourceCode.getLocFromIndex(comment.range[0] + issue.end)
              },
              fix: hasReplacement ? 
                (fixer) => fixer.replaceTextRange(
                  [comment.range[0] + issue.start, comment.range[0] + issue.end],
                  issue.replacement
                ) : null
            });
          });

          // Report sentence-level replacements for comments
          if (result.sentenceReplacements && result.sentenceReplacements.length > 0) {
            result.sentenceReplacements.forEach(replacement => {
              context.report({
                node: comment,
                message: `Comment ${replacement.message}`,
                loc: {
                  start: sourceCode.getLocFromIndex(comment.range[0] + replacement.start),
                  end: sourceCode.getLocFromIndex(comment.range[0] + replacement.end)
                },
                fix: (fixer) => {
                  if (replacement.type === 'full-text-correction') {
                    // For full comment replacement
                    const isBlockComment = comment.type === 'Block';
                    const correctedComment = isBlockComment ? 
                      `/* ${replacement.correctedText} */` : 
                      `// ${replacement.correctedText}`;
                    return fixer.replaceText(comment, correctedComment);
                  } else {
                    // For sentence-level replacements within comments
                    return fixer.replaceTextRange(
                      [comment.range[0] + replacement.start, comment.range[0] + replacement.end],
                      replacement.correctedText
                    );
                  }
                }
              });
            });
          }
        });
      }
    };
  }
};