import { expect } from 'chai';
import { TrimRule } from './TrimRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('TrimRule', () => {
  let rule: TrimRule;

  beforeEach(() => {
    rule = new TrimRule('subject', RuleConfigSeverity.Error, 'always');
  });

  describe('validate', () => {
    it('should validate when input has no leading or trailing whitespace', () => {
      const result1 = rule.validate(['clean text']);
      const result2 = rule.validate(['multiple\nlines\nno whitespace']);
      expect(result1).to.be.null;
      expect(result2).to.be.null;
    });

    it('should not validate when input has leading or trailing whitespace', () => {
      const result1 = rule.validate([' leading space']);
      const result2 = rule.validate(['trailing space ']);
      const result3 = rule.validate([' both sides ']);
      const result4 = rule.validate(['\ttab character']);
      const result5 = rule.validate(['newline\n']);

      expect(result1).to.deep.equal({ 0: 'The subject must have leading or trailing whitespace' });
      expect(result2).to.deep.equal({ 0: 'The subject must have leading or trailing whitespace' });
      expect(result3).to.deep.equal({ 0: 'The subject must have leading or trailing whitespace' });
      expect(result4).to.deep.equal({ 0: 'The subject must have leading or trailing whitespace' });
      expect(result5).to.deep.equal({ 0: 'The subject must have leading or trailing whitespace' });
    });

    it('should validate multiple parts', () => {
      const result = rule.validate(['clean', ' dirty ', 'also clean']);
      expect(result).to.deep.equal({ 1: 'The subject must have leading or trailing whitespace' });
    });
  });

  describe('fix', () => {
    it('should remove leading and trailing whitespace', () => {
      const [errors1, fixed1] = rule.fix([' leading space']);
      const [errors2, fixed2] = rule.fix(['trailing space ']);
      const [errors3, fixed3] = rule.fix([' both sides ']);

      expect(errors1).to.be.null;
      expect(fixed1).to.deep.equal(['leading space']);
      expect(errors2).to.be.null;
      expect(fixed2).to.deep.equal(['trailing space']);
      expect(errors3).to.be.null;
      expect(fixed3).to.deep.equal(['both sides']);
    });

    it('should return unchanged when no fix is needed', () => {
      const [errors, fixed] = rule.fix(['clean text']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['clean text']);
    });

    it('should fix multiple parts', () => {
      const [errors, fixed] = rule.fix([' leading', 'clean', 'trailing ']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['leading', 'clean', 'trailing']);
    });
  });

  describe('check', () => {
    it('should return valid output for valid input', () => {
      const [output, errors, warnings] = rule.check(['clean text']);
      expect(output).to.deep.equal(['clean text']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should fix invalid inputs', () => {
      const [output1, errors1, warnings1] = rule.check([' leading space']);
      const [output2, errors2, warnings2] = rule.check(['trailing space ']);

      expect(output1).to.deep.equal(['leading space']);
      expect(errors1).to.be.null;
      expect(warnings1).to.be.null;
      expect(output2).to.deep.equal(['trailing space']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });
  });

  describe('check with fix parameter', () => {
    it('should apply fix when fix=true', () => {
      const [output, errors, warnings] = rule.check([' leading space '], true);
      expect(output).to.deep.equal(['leading space']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should not apply fix when fix=false', () => {
      const [output, errors, warnings] = rule.check([' leading space '], false);
      expect(output).to.deep.equal([' leading space ']);
      expect(errors).to.deep.equal({ 0: 'The subject must have leading or trailing whitespace' });
      expect(warnings).to.be.null;
    });

    it('should return valid input unchanged regardless of fix parameter', () => {
      const [output1, errors1, warnings1] = rule.check(['clean text'], false);
      const [output2, errors2, warnings2] = rule.check(['clean text'], true);
      expect(output1).to.deep.equal(['clean text']);
      expect(errors1).to.be.null;
      expect(warnings1).to.be.null;
      expect(output2).to.deep.equal(['clean text']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });

    it('should return warning when fix=false and input invalid with WARNING level', () => {
      const warningRule = new TrimRule('subject', RuleConfigSeverity.Warning, 'always');
      const [output, errors, warnings] = warningRule.check([' leading space '], false);
      expect(output).to.deep.equal([' leading space ']);
      expect(errors).to.be.null;
      expect(warnings).to.deep.equal({ 0: 'The subject must have leading or trailing whitespace' });
    });
  });
});
