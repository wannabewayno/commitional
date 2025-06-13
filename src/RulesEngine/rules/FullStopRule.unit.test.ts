import assert from 'node:assert';
import { FullStopRule } from './FullStopRule.js';
import { RuleConfigSeverity } from './BaseRule.js';
import { expect } from 'chai';

describe('FullStopRule', () => {
  // Test construction
  describe('constructor', () => {
    it('should create a rule with the correct parameters', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      assert.ok(rule);
    });
  });

  // Test validation
  describe('validate', () => {
    it('should validate text ending with the specified character', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.validate('Hello.'), true);
    });

    it('should invalidate text not ending with the specified character', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.validate('Hello'), false);
    });

    it('should handle empty input', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.validate(''), false);
    });
  });

  // Test fixing
  describe('fix', () => {
    it('should add the character when applicable is always', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.fix('Hello'), 'Hello.');
    });

    it('should remove the character when applicable is never', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'never', '.');
      assert.strictEqual(rule.fix('Hello.'), 'Hello');
    });

    it('should return null when already valid', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.fix('Hello.'), null);
    });
  });

  // Test error message
  describe('errorMessage', () => {
    const symbolsAn = Object.entries({
      '!': 'exclamation mark',
      '*': 'asterix',
      '@': 'At sign',
      '&': 'ampersand',
      '=': 'equals sign',
      _: 'underscore',
      '[': 'opening square bracket',
      '(': 'opening paranthesis',
      "'": 'apostrophe',
    });

    const symbolsA = Object.entries({
      '.': 'full stop',
      '|': 'vertical bar',
      $: 'dollar sign',
      '^': 'carrot',
      '#': 'hash',
      '+': 'plus sign',
      '-': 'hyphen',
      ':': 'colon',
      ';': 'semicolon',
      '?': 'question mark',
      ',': 'comma',
      '/': 'slash',
      '\\': 'backslash',
      ']': 'closing square bracket',
      ')': 'closing paranthesis',
      '"': 'quotation mark',
      '%': 'percent sign',
      '~': 'tilde',
      '`': 'backtick',
    });

    describe('applicable: always', () => {
      symbolsAn.forEach(([symbol, symbolName]) => {
        it(`should return helpful error message with plain english name of symbol for '${symbol}'`, () => {
          const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', symbol);
          assert.strictEqual(rule.errorMessage(), `the subject must end with an ${symbolName}`);
        });
      });

      symbolsA.forEach(([symbol, symbolName]) => {
        it(`should return helpful error message with plain english name of symbol for '${symbol}'`, () => {
          const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', symbol);
          assert.strictEqual(rule.errorMessage(), `the subject must end with a ${symbolName}`);
        });
      });

      it('should return helpful error message with symbol when no symbol name has been mapped', () => {
        const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '<');
        assert.strictEqual(rule.errorMessage(), "the subject must end with a '<'");
      });
    });

    describe('applicable: never', () => {
      symbolsAn.forEach(([symbol, symbolName]) => {
        it(`should return helpful error message with plain english name of symbol for '${symbol}'`, () => {
          const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'never', symbol);
          assert.strictEqual(rule.errorMessage(), `the subject must not end with an ${symbolName}`);
        });
      });

      symbolsA.forEach(([symbol, symbolName]) => {
        it(`should return helpful error message with plain english name of symbol for '${symbol}'`, () => {
          const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'never', symbol);
          assert.strictEqual(rule.errorMessage(), `the subject must not end with a ${symbolName}`);
        });
      });

      it('should return helpful error message with symbol when no symbol name has been mapped', () => {
        const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'never', '<');
        assert.strictEqual(rule.errorMessage(), "the subject must not end with a '<'");
      });
    });
  });

  // Test check method (integration)
  describe('check', () => {
    it('should return valid input when ending with the character', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      const result = rule.check('Hello.');
      assert.strictEqual(result, 'Hello.');
    });

    it('should fix input when not ending with the character', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      const result = rule.check('Hello');
      assert.strictEqual(result, 'Hello.');
    });

    it('should handle never applicable correctly', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'never', '.');

      // Text with period should be fixed with 'never'
      const result = rule.check('Hello.');
      assert.strictEqual(result, 'Hello');

      // Text without period should pass with 'never'
      const result2 = rule.check('Hello');
      assert.strictEqual(result2, 'Hello');
    });

    it('should return error object when level is WARNING and cannot fix', () => {
      // This is a contrived example since FullStopRule can usually fix issues
      // Let's create a situation where fix() returns null
      const mockRule = new FullStopRule('subject', RuleConfigSeverity.Warning, 'always', '.');
      mockRule.fix = () => null; // Override fix to return null

      const result = mockRule.check('Hello');

      assert.ok(result instanceof Error);
      assert.strictEqual(result.message, 'the subject must end with a full stop');
    });

    it('should throw error when level is ERROR and cannot fix', () => {
      // Similar to above, create a situation where fix() returns null
      const mockRule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      mockRule.fix = () => null; // Override fix to return null

      expect(() => mockRule.check('Hello')).throws('the subject must end with a full stop');
    });
  });
});
