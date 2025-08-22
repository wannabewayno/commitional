import { expect } from 'chai';
import { MaxLengthRule } from './MaxLengthRule.js';
import { RuleConfigSeverity } from './BaseRule.js';

describe('MaxLengthRule', () => {
  // Test construction
  describe('constructor', () => {
    it('should create a rule with the correct parameters', () => {
      expect(() => new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 10)).to.not.throw();
    });
  });

  // Test validation
  describe('validate', () => {
    it('should validate text within max length', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 10);
      const result = rule.validate(['Hello']);
      expect(result).to.be.null;
    });

    it('should invalidate text exceeding max length', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const result = rule.validate(['Hello World']);
      expect(result).to.deep.equal({ 0: 'The subject must not exceed 5 characters' });
    });

    it('should validate text exactly at max length', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const result = rule.validate(['Hello']);
      expect(result).to.be.null;
    });

    it('should handle empty input', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const result = rule.validate(['']);
      expect(result).to.be.null;
    });

    it('should validate multiple parts', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const result = rule.validate(['Hello', 'Hi', 'Hello World']);
      expect(result).to.deep.equal({ 2: 'The subject must not exceed 5 characters' });
    });

    it('should handle never applicable correctly', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'never', 5);
      const result1 = rule.validate(['Hi']); // Short should be invalid
      const result2 = rule.validate(['Hello World']); // Long should be valid
      expect(result1).to.deep.equal({ 0: 'The subject must not exceed 5 characters' });
      expect(result2).to.be.null;
    });
  });

  // Test fixing
  describe('fix', () => {
    it('should truncate text exceeding max length', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const [errors, fixed] = rule.fix(['Hello World']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['Hello']);
    });

    it('should return unchanged text within max length', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 10);
      const [errors, fixed] = rule.fix(['Hello']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['Hello']);
    });

    it('should fix multiple parts', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const [errors, fixed] = rule.fix(['Hello World', 'Hi', 'Testing']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['Hello', 'Hi', 'Testi']);
    });

    it('should return original parts with errors when applicable is never', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'never', 5);
      const original = ['Hi', 'Hello World'];
      const [errors, fixed] = rule.fix(original);
      expect(errors).to.deep.equal({ 0: 'The subject must not exceed 5 characters' });
      expect(fixed).to.deep.equal(original);
    });
  });

  // Test check method (integration)
  describe('check', () => {
    it('should return valid output when within max length', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 10);
      const [output, errors, warnings] = rule.check(['Hello']);
      expect(output).to.deep.equal(['Hello']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should fix input when exceeding max length', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const [output, errors, warnings] = rule.check(['Hello World']);
      expect(output).to.deep.equal(['Hello']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should handle never applicable correctly', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'never', 5);

      // Short text should fail with 'never'
      const [output1, errors1, warnings1] = rule.check(['Hi']);
      expect(output1).to.deep.equal(['Hi']);
      expect(errors1).to.deep.equal({ 0: 'The subject must not exceed 5 characters' });
      expect(warnings1).to.be.null;

      // Long text should pass with 'never'
      const [output2, errors2, warnings2] = rule.check(['Hello World']);
      expect(output2).to.deep.equal(['Hello World']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });

    it('should return fixed output when level is WARNING and can fix', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Warning, 'always', 5);
      const [output, errors, warnings] = rule.check(['Hello World']);
      expect(output).to.deep.equal(['Hello']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should return errors when level is ERROR and cannot fix', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'never', 10);
      const [output, errors, warnings] = rule.check(['Hi']);
      expect(output).to.deep.equal(['Hi']);
      expect(errors).to.deep.equal({ 0: 'The subject must not exceed 10 characters' });
      expect(warnings).to.be.null;
    });
  });

  describe('check with fix parameter', () => {
    it('should apply fix when fix=true', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const [output, errors, warnings] = rule.check(['Hello World'], true);
      expect(output).to.deep.equal(['Hello']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should not apply fix when fix=false', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const [output, errors, warnings] = rule.check(['Hello World'], false);
      expect(output).to.deep.equal(['Hello World']);
      expect(errors).to.deep.equal({ 0: 'The subject must not exceed 5 characters' });
      expect(warnings).to.be.null;
    });

    it('should return valid input unchanged regardless of fix parameter', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 10);
      const [output1, errors1, warnings1] = rule.check(['Hello'], false);
      const [output2, errors2, warnings2] = rule.check(['Hello'], true);
      expect(output1).to.deep.equal(['Hello']);
      expect(errors1).to.be.null;
      expect(warnings1).to.be.null;
      expect(output2).to.deep.equal(['Hello']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });

    it('should return warning when fix=false and input invalid with WARNING level', () => {
      const rule = new MaxLengthRule('subject', RuleConfigSeverity.Warning, 'always', 5);
      const [output, errors, warnings] = rule.check(['Hello World'], false);
      expect(output).to.deep.equal(['Hello World']);
      expect(errors).to.be.null;
      expect(warnings).to.deep.equal({ 0: 'The subject must not exceed 5 characters' });
    });
  });
});
