import { expect } from 'chai';
import { FullStopRule } from './FullStopRule.js';
import { RuleConfigSeverity } from './BaseRule.js';

describe('FullStopRule', () => {
  // Test construction
  describe('constructor', () => {
    it('should create a rule with the correct parameters', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      expect(rule).to.exist;
    });
  });

  // Test validation
  describe('validate', () => {
    it('should validate text ending with the specified character', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      expect(rule.validate(['Hello.'])).to.be.null;
    });

    it('should invalidate text not ending with the specified character', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      expect(rule.validate(['Hello'])).to.deep.equal({ 0: 'the subject must end with a full stop' });
    });

    it('should handle empty input', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      expect(rule.validate([''])).to.deep.equal({ 0: 'the subject must end with a full stop' });
    });
  });

  // Test fixing
  describe('fix', () => {
    it('should add the character when applicable is always', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      const [errors, fixed] = rule.fix(['Hello']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['Hello.']);
    });

    it('should remove the character when applicable is never', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'never', '.');
      const [errors, fixed] = rule.fix(['Hello.']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['Hello']);
    });

    it('should return null when already valid', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      const [errors, fixed] = rule.fix(['Hello.']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['Hello.']);
    });
  });

  // Error messages are tested indirectly through validation failures

  // Test check method (integration)
  describe('check', () => {
    it('should return null when ending with the character', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      const [output, errors, warnings] = rule.check(['Hello.']);
      expect(output).to.deep.equal(['Hello.']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should fix input when not ending with the character', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      const [output, errors, warnings] = rule.check(['Hello']);
      expect(output).to.deep.equal(['Hello.']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should handle never applicable correctly', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'never', '.');

      // Text with period should be fixed with 'never'
      const [output1, errors1, warnings1] = rule.check(['Hello.']);
      expect(output1).to.deep.equal(['Hello']);
      expect(errors1).to.be.null;
      expect(warnings1).to.be.null;

      // Text without period should pass with 'never'
      const [output2, errors2, warnings2] = rule.check(['Hello']);
      expect(output2).to.deep.equal(['Hello']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });

    it('should return warnings when level is WARNING and validation fails', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Warning, 'always', '.');
      const [output, errors, warnings] = rule.check(['Hello'], false); // Don't fix
      expect(output).to.deep.equal(['Hello']);
      expect(errors).to.be.null;
      expect(warnings).to.deep.equal({ 0: 'the subject must end with a full stop' });
    });

    it('should return errors when level is ERROR and validation fails without fix', () => {
      const rule = new FullStopRule('subject', RuleConfigSeverity.Error, 'always', '.');
      const [output, errors, warnings] = rule.check(['Hello'], false); // Don't fix
      expect(output).to.deep.equal(['Hello']);
      expect(errors).to.deep.equal({ 0: 'the subject must end with a full stop' });
      expect(warnings).to.be.null;
    });
  });
});
