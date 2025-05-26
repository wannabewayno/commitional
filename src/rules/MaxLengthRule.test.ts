import assert from 'node:assert';
import { MaxLengthRule } from './MaxLengthRule.js';
import { RuleLevel } from './BaseRule.js';

describe('MaxLengthRule', () => {
  // Test construction
  describe('constructor', () => {
    it('should create a rule with the correct parameters', () => {
      assert.doesNotThrow(() => new MaxLengthRule([RuleLevel.ERROR, 'always', 10]));
    });
  });

  // Test validation
  describe('validate', () => {
    it('should validate text within max length', () => {
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'always', 10]);
      assert.strictEqual(rule.validate('Hello'), true);
    });

    it('should invalidate text exceeding max length', () => {
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'always', 5]);
      assert.strictEqual(rule.validate('Hello World'), false);
    });

    it('should validate text exactly at max length', () => {
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'always', 5]);
      assert.strictEqual(rule.validate('Hello'), true);
    });

    it('should handle empty input', () => {
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'always', 5]);
      assert.strictEqual(rule.validate(''), true);
    });
  });

  // Test fixing
  describe('fix', () => {
    it('should truncate text exceeding max length', () => {
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'always', 5]);
      assert.strictEqual(rule.fix('Hello World'), 'Hello');
    });

    it('should return original text for text within max length', () => {
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'always', 10]);
      assert.strictEqual(rule.fix('Hello'), 'Hello');
    });
  });

  // Test error message
  describe('errorMessage', () => {
    it('should return correct error message', () => {
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'always', 10]);
      assert.strictEqual(rule.errorMessage(), 'exceed 10 characters');
    });
  });

  // Test check method (integration)
  describe('check', () => {
    it('should return valid input when within max length', () => {
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'always', 10]);
      const result = rule.check('Hello');
      assert.strictEqual(result, 'Hello');
    });

    it('should fix input when exceeding max length', () => {
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'always', 5]);
      const result = rule.check('Hello World');
      assert.strictEqual(result, 'Hello');
    });

    it('should handle never applicable correctly', () => {
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'never', 5]);

      // Short text should fail with 'never'
      assert.throws(() => {
        rule.check('Hi');
      }, /exceed 5 characters/);

      // Long text should pass with 'never'
      const result = rule.check('Hello World');
      assert.strictEqual(result, 'Hello World');
    });

    it('should return error object when level is WARNING', () => {
      const rule = new MaxLengthRule([RuleLevel.WARNING, 'always', 5]);
      const result = rule.check('Hello World');

      // With the updated check method, it should return a fixed string if fixable
      assert.strictEqual(result, 'Hello');
    });

    it('should throw error when level is ERROR', () => {
      // Create a rule that can't be fixed (by making applicable 'never')
      const rule = new MaxLengthRule([RuleLevel.ERROR, 'never', 10]);

      assert.throws(() => {
        rule.check('Hi');
      }, /exceed 10 characters/);
    });
  });
});
