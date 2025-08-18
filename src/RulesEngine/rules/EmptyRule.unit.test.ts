import { expect } from 'chai';
import { EmptyRule } from './EmptyRule.js';
import { RuleConfigSeverity } from './BaseRule.js';

describe('EmptyRule', () => {
  // Test construction
  describe('constructor', () => {
    it('should create a rule with the correct parameters', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      expect(rule).to.exist;
    });
  });

  // Test validation
  describe('validate', () => {
    it('should validate empty parts when applicable is always', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      const result = rule.validate(['', '   ']);
      expect(result).to.be.null;
    });

    it('should invalidate non-empty parts when applicable is always', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      const result = rule.validate(['Hello', '']);
      expect(result).to.deep.equal({ 0: 'the subject must always be empty' });
    });

    it('should validate non-empty parts when applicable is never', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');
      const result = rule.validate(['Hello', 'World']);
      expect(result).to.be.null;
    });

    it('should invalidate empty parts when applicable is never', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');
      const result = rule.validate(['', 'Hello']);
      expect(result).to.deep.equal({ 0: 'the subject must never be empty' });
    });
  });

  // Test fixing
  describe('fix', () => {
    it('should fix non-empty parts when applicable is always', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      const [errors, fixed] = rule.fix(['Hello', 'World']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['', '']);
    });

    it('should return original parts with errors when applicable is never', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');
      const original = ['', 'Hello'];
      const [errors, fixed] = rule.fix(original);
      expect(errors).to.deep.equal({ 0: 'the subject must never be empty' });
      expect(fixed).to.deep.equal(original);
    });
  });

  // Test check method (integration)
  describe('check', () => {
    it('should return fixed parts when applicable is always and can fix', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      const [output, errors, warnings] = rule.check(['Hello', 'World']);
      expect(output).to.deep.equal(['', '']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should handle never applicable correctly', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');

      // Empty parts should fail with 'never'
      const [output1, errors1, warnings1] = rule.check(['', 'Hello']);
      expect(output1).to.deep.equal(['', 'Hello']);
      expect(errors1).to.deep.equal({ 0: 'the subject must never be empty' });
      expect(warnings1).to.be.null;

      // Non-empty parts should pass with 'never'
      const [output2, errors2, warnings2] = rule.check(['Hello', 'World']);
      expect(output2).to.deep.equal(['Hello', 'World']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });

    it('should return warnings when level is WARNING and cannot fix', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Warning, 'never');
      const [output, errors, warnings] = rule.check(['', 'Hello']);
      expect(output).to.deep.equal(['', 'Hello']);
      expect(errors).to.be.null;
      expect(warnings).to.deep.equal({ 0: 'the subject must never be empty' });
    });

    it('should return errors when level is ERROR and cannot fix', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');
      const [output, errors, warnings] = rule.check(['', 'Hello']);
      expect(output).to.deep.equal(['', 'Hello']);
      expect(errors).to.deep.equal({ 0: 'the subject must never be empty' });
      expect(warnings).to.be.null;
    });
  });

  describe('check with fix parameter', () => {
    it('should apply fix when fix=true', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      const [output, errors, warnings] = rule.check(['Hello', 'World'], true);
      expect(output).to.deep.equal(['', '']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should not apply fix when fix=false', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      const [output, errors, warnings] = rule.check(['Hello', 'World'], false);
      expect(output).to.deep.equal(['Hello', 'World']);
      expect(errors).to.deep.equal({ 0: 'the subject must always be empty', 1: 'the subject must always be empty' });
      expect(warnings).to.be.null;
    });

    it('should return valid input unchanged regardless of fix parameter', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Error, 'always');
      const [output1, errors1, warnings1] = rule.check(['', ''], false);
      const [output2, errors2, warnings2] = rule.check(['', ''], true);
      expect(output1).to.deep.equal(['', '']);
      expect(errors1).to.be.null;
      expect(warnings1).to.be.null;
      expect(output2).to.deep.equal(['', '']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });

    it('should return warning when fix=false and input invalid with WARNING level', () => {
      const rule = new EmptyRule('subject', RuleConfigSeverity.Warning, 'always');
      const [output, errors, warnings] = rule.check(['Hello'], false);
      expect(output).to.deep.equal(['Hello']);
      expect(errors).to.be.null;
      expect(warnings).to.deep.equal({ 0: 'the subject must always be empty' });
    });
  });
});
