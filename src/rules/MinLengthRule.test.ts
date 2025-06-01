import { expect } from 'chai';
import { MinLengthRule } from './MinLengthRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('MinLengthRule', () => {
  const minLength = 10;
  let rule: MinLengthRule;

  beforeEach(() => {
    rule = new MinLengthRule(RuleConfigSeverity.Error, 'always', minLength);
  });

  describe('validate', () => {
    it('should validate when input meets or exceeds minimum length', () => {
      expect(rule.validate('exactly 10')).to.be.true;
      expect(rule.validate('this is longer than minimum')).to.be.true;
    });

    it('should not validate when input is shorter than minimum length', () => {
      expect(rule.validate('too short')).to.be.false;
      expect(rule.validate('short')).to.be.false;
    });
  });

  describe('fix', () => {
    it('should return null as minimum length issues cannot be automatically fixed', () => {
      expect(rule.fix('too short')).to.be.null;
      expect(rule.fix('this is longer than minimum')).to.be.null;
    });
  });

  describe('errorMessage', () => {
    it('should provide a helpful error message', () => {
      expect(rule.errorMessage()).to.equal(`be at least ${minLength} characters`);
    });
  });

  describe('check', () => {
    it('should return valid input as-is', () => {
      expect(rule.check('exactly 10')).to.equal('exactly 10');
      expect(rule.check('this is longer than minimum')).to.equal('this is longer than minimum');
    });

    it('should throw an error for invalid input', () => {
      expect(() => rule.check('too short')).to.throw();
      expect(() => rule.check('short')).to.throw();
    });
  });
});
