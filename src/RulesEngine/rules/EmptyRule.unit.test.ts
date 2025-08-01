import assert from 'node:assert';
import { EmptyRule } from './EmptyRule.js';
import { RuleConfigSeverity } from './BaseRule.js';

describe('EmptyRule', () => {
  // Test construction
  describe('constructor', () => {
    it('should create a rule with the correct parameters', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      assert.ok(rule);
    });
  });

  // Test validation
  describe('validate', () => {
    it('should validate empty text', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      assert.strictEqual(rule.validate(''), true);
      assert.strictEqual(rule.validate('   '), true);
    });

    it('should invalidate non-empty text', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      assert.strictEqual(rule.validate('Hello'), false);
    });
  });

  // Test fixing
  describe('fix', () => {
    it('should fix non-empty text when applicable is always', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      assert.strictEqual(rule.fix('Hello'), '');
    });

    it('should return null when applicable is never', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');
      assert.strictEqual(rule.fix(''), null);
    });
  });

  // Test error message
  describe('errorMessage', () => {
    it('should return correct error message', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      assert.strictEqual(rule.errorMessage(), 'the subject must always be empty');
    });
  });

  // Test check method (integration)
  describe('check', () => {
    it('should return empty string when applicable is always', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      const result = rule.check('Hello');
      assert.strictEqual(result, '');
    });

    it('should handle never applicable correctly', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');

      // Empty text should fail with 'never'
      assert.throws(() => {
        rule.check('');
      }, /be empty/);

      // Non-empty text should pass with 'never'
      const result = rule.check('Hello');
      assert.strictEqual(result, 'Hello');
    });

    it('should return error object when level is WARNING and cannot fix', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Warning, 'never');
      const result = rule.check('');

      assert.ok(result instanceof Error);
      assert.strictEqual(result.message, 'the subject must never be empty');
    });

    it('should throw error when level is ERROR and cannot fix', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');

      assert.throws(() => {
        rule.check('');
      }, /be empty/);
    });
  });

  describe('check with fix parameter', () => {
    it('should apply fix when fix=true', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      const result = rule.check('Hello', true);
      assert.strictEqual(result, '');
    });

    it('should not apply fix when fix=false', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      assert.throws(() => {
        rule.check('Hello', false);
      }, /be empty/);
    });

    it('should return valid input unchanged regardless of fix parameter', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      assert.strictEqual(rule.check('', false), '');
      assert.strictEqual(rule.check('', true), '');
    });

    it('should return error when fix=false and input invalid with WARNING level', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Warning, 'always');
      const result = rule.check('Hello', false);
      assert.ok(result instanceof Error);
    });
  });
});
