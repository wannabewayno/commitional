import assert from 'node:assert';
import { FullStopRule } from './FullStopRule.js';
import { RuleConfigSeverity } from './BaseRule.js';

describe('FullStopRule', () => {
  // Test construction
  describe('constructor', () => {
    it('should create a rule with the correct parameters', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'always', '.');
      assert.ok(rule);
    });
  });

  // Test validation
  describe('validate', () => {
    it('should validate text ending with the specified character', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.validate('Hello.'), true);
    });

    it('should invalidate text not ending with the specified character', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.validate('Hello'), false);
    });

    it('should handle empty input', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.validate(''), false);
    });
  });

  // Test fixing
  describe('fix', () => {
    it('should add the character when applicable is always', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.fix('Hello'), 'Hello.');
    });

    it('should remove the character when applicable is never', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'never', '.');
      assert.strictEqual(rule.fix('Hello.'), 'Hello');
    });

    it('should return null when already valid', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.fix('Hello.'), null);
    });
  });

  // Test error message
  describe('errorMessage', () => {
    it('should return correct error message', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'always', '.');
      assert.strictEqual(rule.errorMessage(), 'end with "."');
    });
  });

  // Test check method (integration)
  describe('check', () => {
    it('should return valid input when ending with the character', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'always', '.');
      const result = rule.check('Hello.');
      assert.strictEqual(result, 'Hello.');
    });

    it('should fix input when not ending with the character', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'always', '.');
      const result = rule.check('Hello');
      assert.strictEqual(result, 'Hello.');
    });

    it('should handle never applicable correctly', () => {
      const rule = new FullStopRule(RuleConfigSeverity.Error, 'never', '.');

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
      const mockRule = new FullStopRule(RuleConfigSeverity.Warning, 'always', '.');
      mockRule.fix = () => null; // Override fix to return null

      const result = mockRule.check('Hello');

      assert.ok(result instanceof Error);
      assert.strictEqual(result.message, 'end with "."');
    });

    it('should throw error when level is ERROR and cannot fix', () => {
      // Similar to above, create a situation where fix() returns null
      const mockRule = new FullStopRule(RuleConfigSeverity.Error, 'always', '.');
      mockRule.fix = () => null; // Override fix to return null

      assert.throws(() => {
        mockRule.check('Hello');
      }, /end with "."/);
    });
  });
});
