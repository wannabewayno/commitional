import { expect } from 'chai';
import { MaxLineLengthRule } from './MaxLineLengthRule.js';
import { RuleConfigSeverity } from './BaseRule.js';

describe('MaxLineLengthRule', () => {
  describe('constructor', () => {
    it('should create a rule with the correct parameters', () => {
      expect(() => new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 72)).to.not.throw();
    });
  });

  describe('validate', () => {
    it('should validate text with lines within limit', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      expect(rule.validate(['Hello\nWorld'])).to.be.null;
    });

    it('should invalidate text with lines exceeding limit', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 5);
      expect(rule.validate(['Hello World'])).to.deep.equal({ 0: 'the body must be wrapped at 5 characters' });
    });

    it('should handle empty input', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      expect(rule.validate([''])).to.be.null;
    });
  });

  describe('fix', () => {
    it('should wrap long lines', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      const [errors, fixed] = rule.fix(['This is a very long line that exceeds the limit']);
      expect(errors).to.be.null;
      const lines = fixed[0]?.split('\n');
      expect(lines?.every(line => line.length <= 10)).to.be.true;
    });

    it.only('should preserve paragraphs', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      const [errors, fixed] = rule.fix(['First paragraph\n\nSecond paragraph']);
      expect(errors).to.be.null;
      console.log(fixed);
      expect(fixed[0]?.includes('\n\n')).to.be.true;
    });
  });

  describe('check', () => {
    it('should return null when within limit', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 20);
      const [output, errors, warnings] = rule.check(['Short line']);
      expect(output).to.deep.equal(['Short line']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should fix input when exceeding limit', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      const [output, errors, warnings] = rule.check(['This is a very long line']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
      const lines = output[0]?.split('\n');
      expect(lines?.every(line => line.length <= 10)).to.be.true;
    });
  });

  describe('check with fix parameter', () => {
    it('should apply fix when fix=true', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      const [output, errors, warnings] = rule.check(['This line is definitely longer than ten characters'], true);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;

      const lines = output[0]?.split('\n');
      expect(lines?.every(line => line.length <= 10)).to.be.true;
    });

    it('should not apply fix when fix=false', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 10);
      const [output, errors, warnings] = rule.check(['This is a very long line'], false);
      expect(output).to.deep.equal(['This is a very long line']);
      expect(errors).to.deep.equal({ 0: 'the body must be wrapped at 10 characters' });
      expect(warnings).to.be.null;
    });

    it('should return valid input unchanged regardless of fix parameter', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Error, 'always', 20);
      const [output1, errors1, warnings1] = rule.check(['Short'], false);
      const [output2, errors2, warnings2] = rule.check(['Short'], true);

      expect(errors1).to.be.null;
      expect(warnings1).to.be.null;
      expect(output1).to.deep.equal(['Short']);

      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
      expect(output2).to.deep.equal(['Short']);
    });

    it('should return error when fix=false and input invalid with WARNING level', () => {
      const rule = new MaxLineLengthRule('body', RuleConfigSeverity.Warning, 'always', 10);
      const [output, errors, warnings] = rule.check(['This is a very long line'], false);
      expect(output).to.deep.equal(['This is a very long line']);
      expect(errors).to.be.null;
      expect(warnings).to.deep.equal({ 0: 'the body must be wrapped at 10 characters' });
    });
  });
});
