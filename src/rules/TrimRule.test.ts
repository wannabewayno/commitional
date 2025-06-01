import { expect } from 'chai';
import { TrimRule } from './TrimRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('TrimRule', () => {
  let rule: TrimRule;

  beforeEach(() => {
    rule = new TrimRule(RuleConfigSeverity.Error, 'always');
  });

  describe('validate', () => {
    it('should validate when input has no leading or trailing whitespace', () => {
      expect(rule.validate('clean text')).to.be.true;
      expect(rule.validate('multiple\nlines\nno whitespace')).to.be.true;
    });

    it('should not validate when input has leading or trailing whitespace', () => {
      expect(rule.validate(' leading space')).to.be.false;
      expect(rule.validate('trailing space ')).to.be.false;
      expect(rule.validate(' both sides ')).to.be.false;
      expect(rule.validate('\ttab character')).to.be.false;
      expect(rule.validate('newline\n')).to.be.false;
    });
  });

  describe('fix', () => {
    it('should remove leading and trailing whitespace', () => {
      expect(rule.fix(' leading space')).to.equal('leading space');
      expect(rule.fix('trailing space ')).to.equal('trailing space');
      expect(rule.fix(' both sides ')).to.equal('both sides');
      expect(rule.fix('\ttab character')).to.equal('tab character');
      expect(rule.fix('newline\n')).to.equal('newline');
    });

    it('should return trimmed string even when no fix is needed', () => {
      expect(rule.fix('clean text')).to.equal('clean text');
    });
  });

  describe('errorMessage', () => {
    it('should provide a helpful error message', () => {
      expect(rule.errorMessage()).to.equal('not have leading or trailing whitespace');
    });
  });

  describe('check', () => {
    it('should return valid input as-is', () => {
      expect(rule.check('clean text')).to.equal('clean text');
    });

    it('should heal for invalid inputs', () => {
      expect(() => {
        const healed = rule.check(' leading space');
        expect(healed).to.equal('leading space');
      }).to.not.throw();

      expect(() => {
        const healed = rule.check('trailing space ');
        expect(healed).to.equal('trailing space');
      }).to.not.throw();
    });
  });
});
