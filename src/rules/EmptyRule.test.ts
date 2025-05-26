import assert from 'node:assert';
import { EmptyRule } from './EmptyRule.js';
import { RuleLevel } from './BaseRule.js';

describe('EmptyRule', () => {
  // Test construction
  describe('constructor', () => {
    it('should create a rule with the correct parameters', () => {
      const rule = new EmptyRule([RuleLevel.ERROR, 'always', undefined]);
      assert.ok(rule);
    });
  });

  // Test validation
  describe('validate', () => {
    it('should validate empty text', () => {
      const rule = new EmptyRule([RuleLevel.ERROR, 'always', undefined]);
      assert.strictEqual(rule.validate(''), true);
      assert.strictEqual(rule.validate('   '), true);
    });

    it('should invalidate non-empty text', () => {
      const rule = new EmptyRule([RuleLevel.ERROR, 'always', undefined]);
      assert.strictEqual(rule.validate('Hello'), false);
    });
  });

  // Test fixing
  describe('fix', () => {
    it('should fix non-empty text when applicable is always', () => {
      const rule = new EmptyRule([RuleLevel.ERROR, 'always', undefined]);
      assert.strictEqual(rule.fix('Hello'), '');
    });

    it('should return null when applicable is never', () => {
      const rule = new EmptyRule([RuleLevel.ERROR, 'never', undefined]);
      assert.strictEqual(rule.fix(''), null);
    });
  });

  // Test error message
  describe('errorMessage', () => {
    it('should return correct error message', () => {
      const rule = new EmptyRule([RuleLevel.ERROR, 'always', undefined]);
      assert.strictEqual(rule.errorMessage(), 'be empty');
    });
  });

  // Test check method (integration)
  describe('check', () => {
    it('should return empty string when applicable is always', () => {
      const rule = new EmptyRule([RuleLevel.ERROR, 'always', undefined]);
      const result = rule.check('Hello');
      assert.strictEqual(result, '');
    });

    it('should handle never applicable correctly', () => {
      const rule = new EmptyRule([RuleLevel.ERROR, 'never', undefined]);

      // Empty text should fail with 'never'
      assert.throws(() => {
        rule.check('');
      }, /be empty/);

      // Non-empty text should pass with 'never'
      const result = rule.check('Hello');
      assert.strictEqual(result, 'Hello');
    });

    it('should return error object when level is WARNING and cannot fix', () => {
      const rule = new EmptyRule([RuleLevel.WARNING, 'never', undefined]);
      const result = rule.check('');

      assert.ok(result instanceof Error);
      assert.strictEqual(result.message, 'be empty');
    });

    it('should throw error when level is ERROR and cannot fix', () => {
      const rule = new EmptyRule([RuleLevel.ERROR, 'never', undefined]);

      assert.throws(() => {
        rule.check('');
      }, /be empty/);
    });
  });
});
