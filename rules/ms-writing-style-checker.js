const writeGood = require('write-good');

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
    
    if (this.options.checkWeakWords) {
      issues.push(...this.checkWeakWords(text));
    }
    
    if (this.options.checkPassiveVoice) {
      issues.push(...this.checkPassiveVoice(text));
    }
    
    if (this.options.checkTerminology) {
      issues.push(...this.checkTerminology(text));
    }
    
    if (this.options.checkContractions) {
      issues.push(...this.checkContractions(text));
    }
    
    if (this.options.checkProhibited) {
      issues.push(...this.checkProhibited(text));
    }
    
    if (this.options.checkGenderNeutral) {
      issues.push(...this.checkGenderNeutral(text));
    }
    
    if (this.options.checkReadability) {
      issues.push(...this.checkReadability(text));
    }

    return issues;
  }

  checkWeakWords(text) {
    const issues = [];
    const words = text.toLowerCase().split(/\s+/);
    
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
          suggestion: 'Consider removing or replacing with more specific language'
        });
      }
    });
    
    return issues;
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
          suggestion: 'Rewrite in active voice'
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
          suggestion: correct
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
          suggestion: expanded
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
        issues.push({
          type: 'prohibited',
          message: `Avoid using "${match[0]}" in Microsoft documentation.`,
          start: match.index,
          end: match.index + match[0].length,
          severity: 'error',
          suggestion: this.getProhibitedAlternative(match[0])
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
          suggestion: neutral
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
        suggestion: 'Consider revising for clarity'
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
          checkReadability: { type: 'boolean' }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const checker = new MicrosoftStyleChecker(options);
    
    function checkNode(node) {
      if (!node.value || typeof node.value !== 'string') return;
      
      const issues = checker.checkText(node.value);
      
      issues.forEach(issue => {
        const sourceCode = context.getSourceCode();
        const nodeStart = node.range[0];
        
        context.report({
          node,
          message: issue.message,
          loc: {
            start: sourceCode.getLocFromIndex(nodeStart + issue.start),
            end: sourceCode.getLocFromIndex(nodeStart + issue.end)
          },
          fix: issue.suggestion && typeof issue.suggestion === 'string' ? 
            (fixer) => fixer.replaceTextRange(
              [nodeStart + issue.start, nodeStart + issue.end],
              issue.suggestion
            ) : null
        });
      });
    }

    return {
      Literal: checkNode,
      TemplateElement: checkNode,
      JSXText: checkNode,
      Program(node) {
        // Check comments as well
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getAllComments();
        
        comments.forEach(comment => {
          const issues = checker.checkText(comment.value);
          
          issues.forEach(issue => {
            context.report({
              node: comment,
              message: issue.message,
              loc: {
                start: sourceCode.getLocFromIndex(comment.range[0] + issue.start),
                end: sourceCode.getLocFromIndex(comment.range[0] + issue.end)
              }
            });
          });
        });
      }
    };
  }
};