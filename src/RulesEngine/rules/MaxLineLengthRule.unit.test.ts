import assert from 'node:assert';
import { MaxLineLengthRule } from './MaxLineLengthRule.js';
import { RuleConfigSeverity } from './BaseRule.js';

describe('MaxLineLengthRule', () => {
  describe('constructor', () => {
    it('should create a rule with the correct parameters', () => {
      assert.doesNotThrow(() => new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 72));
    });
  });

  describe('validate', () => {
    it('should validate text with lines within limit', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      assert.strictEqual(rule.validate('Hello\nWorld'), true);
    });

    it('should invalidate text with lines exceeding limit', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 5);
      assert.strictEqual(rule.validate('Hello World'), false);
    });

    it('should handle empty input', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      assert.strictEqual(rule.validate(''), true);
    });
  });

  describe('fix', () => {
    it('should wrap long lines', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      const result = rule.fix('This is a very long line that exceeds the limit');
      assert.ok(result);
      const lines = result.split('\n');
      assert.ok(lines.every(line => line.length <= 10));
    });

    it('should preserve paragraphs', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      const result = rule.fix('First paragraph\n\nSecond paragraph');
      assert.ok(result?.includes('\n\n'));
    });
  });

  describe('errorMessage', () => {
    it('should return correct error message', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 72);
      assert.strictEqual(rule.errorMessage(), 'the body must be wrapped at 72 characters');
    });
  });

  describe('check', () => {
    it('should return valid input when within limit', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 20);
      const result = rule.check('Short line');
      assert.strictEqual(result, 'Short line');
    });

    it('should fix input when exceeding limit', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      const result = rule.check('This is a very long line');
      assert.ok(typeof result === 'string');
      const lines = result.split('\n');
      assert.ok(lines.every(line => line.length <= 10));
    });
  });

  describe('check with fix parameter', () => {
    it('should apply fix when fix=true', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      const result = rule.check('This is a very long line', true);
      assert.ok(typeof result === 'string');
      const lines = result.split('\n');
      assert.ok(lines.every(line => line.length <= 10));
    });

    it('should not apply fix when fix=false', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      assert.throws(() => {
        rule.check('This is a very long line', false);
      }, /wrapped at 10 characters/);
    });

    it('should return valid input unchanged regardless of fix parameter', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 20);
      assert.strictEqual(rule.check('Short', false), 'Short');
      assert.strictEqual(rule.check('Short', true), 'Short');
    });

    it('should return error when fix=false and input invalid with WARNING level', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Warning, 'always', 10);
      const result = rule.check('This is a very long line', false);
      assert.ok(result instanceof Error);
    });
  });
});
