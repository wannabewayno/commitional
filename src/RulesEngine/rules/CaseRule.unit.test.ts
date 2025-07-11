import assert from 'node:assert';
import { CaseRule } from './CaseRule.js';
import { RuleConfigSeverity } from './BaseRule.js';

describe('CaseRule', () => {
  // Test construction
  describe('constructor', () => {
    it('should create a rule with a single case type', () => {
      assert.doesNotThrow(() => new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case'));
    });

    it('should create a rule with multiple case types', () => {
      assert.doesNotThrow(
        () => new CaseRule('subject', RuleConfigSeverity.Warning, 'always', ['sentence-case', 'pascal-case']),
      );
    });
  });

  // Test validation
  describe('validate', () => {
    it('should validate lowercase text correctly', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      assert.strictEqual(rule.validate('hello world'), true);
      assert.strictEqual(rule.validate('Hello World'), false);
    });

    it('should validate uppercase text correctly', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'upper-case');
      assert.strictEqual(rule.validate('HELLO WORLD'), true);
      assert.strictEqual(rule.validate('Hello World'), false);
    });

    it('should validate sentence case text correctly', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'sentence-case');
      assert.strictEqual(rule.validate('Hello world'), true);
      assert.strictEqual(rule.validate('hello World'), false);
    });

    it('should validate multiple case types correctly', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', ['sentence-case', 'pascal-case']);
      assert.strictEqual(rule.validate('Hello world'), true);
      assert.strictEqual(rule.validate('HelloWorld'), true);
      assert.strictEqual(rule.validate('hello world'), false);
    });

    it('should handle empty input', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      assert.strictEqual(rule.validate(''), true);
    });
  });

  // Test fixing
  describe('fix', () => {
    it('should fix lowercase text', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      assert.strictEqual(rule.fix('Hello World'), 'hello world');
    });

    it('should fix uppercase text', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'upper-case');
      assert.strictEqual(rule.fix('Hello World'), 'HELLO WORLD');
    });

    it('should fix sentence case text', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'sentence-case');
      assert.strictEqual(rule.fix('hello world'), 'Hello world');
    });

    it('should fix start case text', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'start-case');
      assert.strictEqual(rule.fix('hello world'), 'Hello World');
    });

    it('should use first case type when multiple are provided', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', ['sentence-case', 'pascal-case']);
      assert.strictEqual(rule.fix('hello world'), 'Hello world');
    });

    it('should handle empty input', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      assert.strictEqual(rule.fix(''), null);
    });
  });

  // Test error message
  describe('errorMessage', () => {
    it('should return correct error message for single case type', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      assert.strictEqual(rule.errorMessage(), 'the subject must always be in lower-case');
    });

    it('should return correct error message for multiple case types', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', ['sentence-case', 'pascal-case']);
      assert.strictEqual(rule.errorMessage(), 'the subject must always be in either PascalCase or Sentence case');
    });
  });

  // Test check method (integration)
  describe('check', () => {
    it('should return valid input when it matches the case', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const result = rule.check('hello world');
      assert.strictEqual(result, 'hello world');
    });

    it('should fix input when possible', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const result = rule.check('Hello World');
      assert.strictEqual(result, 'hello world');
    });

    it('should handle never applicable correctly', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'never', 'lower-case');
      const result = rule.check('HELLO WORLD');
      assert.strictEqual(result, 'HELLO WORLD');
    });
  });

  describe('check with fix parameter', () => {
    it('should apply fix when fix=true', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const result = rule.check('Hello World', true);
      assert.strictEqual(result, 'hello world');
    });

    it('should not apply fix when fix=false', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      assert.throws(() => {
        rule.check('Hello World', false);
      }, /lower-case/);
    });

    it('should return valid input unchanged regardless of fix parameter', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      assert.strictEqual(rule.check('hello world', false), 'hello world');
      assert.strictEqual(rule.check('hello world', true), 'hello world');
    });

    it('should return error when fix=false and input invalid with WARNING level', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Warning, 'always', 'lower-case');
      const result = rule.check('Hello World', false);
      assert.ok(result instanceof Error);
    });
  });
});
