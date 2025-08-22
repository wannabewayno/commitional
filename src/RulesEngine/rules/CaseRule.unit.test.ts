import { expect } from 'chai';
import { CaseRule } from './CaseRule.js';
import { RuleConfigSeverity } from './BaseRule.js';

describe('CaseRule', () => {
  // Test construction
  describe('constructor', () => {
    it('should create a rule with a single case type', () => {
      expect(() => new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case')).to.not.throw();
    });

    it('should create a rule with multiple case types', () => {
      expect(
        () => new CaseRule('subject', RuleConfigSeverity.Warning, 'always', ['sentence-case', 'pascal-case']),
      ).to.not.throw();
    });
  });

  // Test validation
  describe('validate', () => {
    it('should validate lowercase text correctly', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const result1 = rule.validate(['hello world']);
      const result2 = rule.validate(['Hello World']);
      expect(result1).to.be.null;
      expect(result2).to.deep.equal({ 0: 'The subject must always be in lower-case' });
    });

    it('should validate uppercase text correctly', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'upper-case');
      const result1 = rule.validate(['HELLO WORLD']);
      const result2 = rule.validate(['Hello World']);
      expect(result1).to.be.null;
      expect(result2).to.deep.equal({ 0: 'The subject must always be in UPPER-CASE' });
    });

    it('should validate sentence case text correctly', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'sentence-case');
      const result1 = rule.validate(['Hello world']);
      const result2 = rule.validate(['hello World']);
      expect(result1).to.be.null;
      expect(result2).to.deep.equal({ 0: 'The subject must always be in Sentence case' });
    });

    it('should validate multiple case types correctly', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', ['sentence-case', 'pascal-case']);
      const result1 = rule.validate(['Hello world']);
      const result2 = rule.validate(['HelloWorld']);
      const result3 = rule.validate(['hello world']);
      expect(result1).to.be.null;
      expect(result2).to.be.null;
      expect(result3).to.deep.equal({ 0: 'The subject must always be in either PascalCase or Sentence case' });
    });

    it('should handle empty input', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const result = rule.validate(['']);
      expect(result).to.be.null;
    });

    it('should validate multiple parts', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const result = rule.validate(['hello', 'WORLD', 'test']);
      expect(result).to.deep.equal({ 1: 'The subject must always be in lower-case' });
    });
  });

  // Test fixing
  describe('fix', () => {
    it('should fix lowercase text', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const [errors, fixed] = rule.fix(['Hello World']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['hello world']);
    });

    it('should fix uppercase text', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'upper-case');
      const [errors, fixed] = rule.fix(['Hello World']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['HELLO WORLD']);
    });

    it('should fix sentence case text', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'sentence-case');
      const [errors, fixed] = rule.fix(['hello world']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['Hello world']);
    });

    it('should fix start case text', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'start-case');
      const [errors, fixed] = rule.fix(['hello world']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['Hello World']);
    });

    it('should use first case type when multiple are provided', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', ['sentence-case', 'pascal-case']);
      const [errors, fixed] = rule.fix(['hello world']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['Hello world']);
    });

    it('should handle empty input', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const [errors, fixed] = rule.fix(['']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['']);
    });

    it('should fix multiple parts', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const [errors, fixed] = rule.fix(['Hello', 'WORLD', 'Test']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['hello', 'world', 'test']);
    });
  });

  // Test check method (integration)
  describe('check', () => {
    it('should return valid output when it matches the case', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const [output, errors, warnings] = rule.check(['hello world']);
      expect(output).to.deep.equal(['hello world']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should fix input when possible', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const [output, errors, warnings] = rule.check(['Hello World']);
      expect(output).to.deep.equal(['hello world']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should handle never applicable correctly', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'never', 'lower-case');
      const [output, errors, warnings] = rule.check(['HELLO WORLD']);
      expect(output).to.deep.equal(['HELLO WORLD']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should handle mixed valid/invalid parts', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const [output, errors, warnings] = rule.check(['hello', 'WORLD']);
      expect(output).to.deep.equal(['hello', 'world']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });
  });

  describe('check with fix parameter', () => {
    it('should apply fix when fix=true', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const [output, errors, warnings] = rule.check(['Hello World'], true);
      expect(output).to.deep.equal(['hello world']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should not apply fix when fix=false', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const [output, errors, warnings] = rule.check(['Hello World'], false);
      expect(output).to.deep.equal(['Hello World']);
      expect(errors).to.deep.equal({ 0: 'The subject must always be in lower-case' });
      expect(warnings).to.be.null;
    });

    it('should return valid input unchanged regardless of fix parameter', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Error, 'always', 'lower-case');
      const [output1, errors1, warnings1] = rule.check(['hello world'], false);
      const [output2, errors2, warnings2] = rule.check(['hello world'], true);
      expect(output1).to.deep.equal(['hello world']);
      expect(errors1).to.be.null;
      expect(warnings1).to.be.null;
      expect(output2).to.deep.equal(['hello world']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });

    it('should return warning when fix=false and input invalid with WARNING level', () => {
      const rule = new CaseRule('subject', RuleConfigSeverity.Warning, 'always', 'lower-case');
      const [output, errors, warnings] = rule.check(['Hello World'], false);
      expect(output).to.deep.equal(['Hello World']);
      expect(errors).to.be.null;
      expect(warnings).to.deep.equal({ 0: 'The subject must always be in lower-case' });
    });
  });
});
