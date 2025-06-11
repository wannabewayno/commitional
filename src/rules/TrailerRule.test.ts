import { expect } from 'chai';
import { TrailerRule } from './TrailerRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('TrailerRule', () => {
  const trailer = 'Signed-off-by: User <user@example.com>';
  let rule: TrailerRule;

  beforeEach(() => {
    rule = new TrailerRule('subject', RuleConfigSeverity.Error, 'always', trailer);
  });

  describe('validate', () => {
    it('should validate when input includes the trailer', () => {
      expect(rule.validate(`Some commit message\n\n${trailer}`)).to.be.true;
      expect(rule.validate(trailer)).to.be.true;
    });

    it('should not validate when input does not include the trailer', () => {
      expect(rule.validate('Some commit message')).to.be.false;
      expect(rule.validate('Signed-off-by: Different User <other@example.com>')).to.be.false;
    });
  });

  describe('fix', () => {
    it('should add trailer to empty input', () => {
      expect(rule.fix('')).to.equal(trailer);
      expect(rule.fix('  ')).to.equal(trailer);
    });

    it('should add trailer with proper spacing when input ends with newlines', () => {
      expect(rule.fix('Some commit message\n\n')).to.equal(`Some commit message\n\n${trailer}`);
      expect(rule.fix('Some commit message\n')).to.equal(`Some commit message\n\n${trailer}`);
    });

    it('should add trailer with proper spacing when input does not end with newlines', () => {
      expect(rule.fix('Some commit message')).to.equal(`Some commit message\n\n${trailer}`);
    });

    it('should return null when input already includes the trailer', () => {
      expect(rule.fix(`Some commit message\n\n${trailer}`)).to.be.null;
      expect(rule.fix(trailer)).to.be.null;
    });

    it('should return null when applicable is never', () => {
      const neverRule = new TrailerRule('subject', RuleConfigSeverity.Error, 'never', trailer);
      expect(neverRule.fix('Some commit message')).to.be.null;
    });
  });

  describe('errorMessage', () => {
    it('should provide a helpful error message', () => {
      expect(rule.errorMessage()).to.equal(`include the trailer "${trailer}"`);
    });
  });

  describe('check', () => {
    it('should return valid input as-is', () => {
      expect(rule.check(`Some commit message\n\n${trailer}`)).to.equal(`Some commit message\n\n${trailer}`);
      expect(rule.check(trailer)).to.equal(trailer);
    });

    it('should heal input by adding trailer', () => {
      expect(() => {
        const healed = rule.check('Some commit message');

        expect(healed).to.contain('Some commit message');
        expect(healed).to.contain(trailer);
      }).to.not.throw();
    });
  });
});
