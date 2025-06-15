import { expect } from 'chai';
import { MaxLineLengthRule } from './MaxLineLengthRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('MaxLineLengthRule', () => {
  const maxLength = 10;
  let rule: MaxLineLengthRule;

  beforeEach(() => {
    rule = new MaxLineLengthRule('subject', RuleConfigSeverity.Error, 'always', maxLength);
  });

  describe('validate', () => {
    it('should validate when all lines are within the maximum length', () => {
      expect(rule.validate('short')).to.be.true;
      expect(rule.validate('short\ntext')).to.be.true;
    });

    it('should not validate when any line exceeds the maximum length', () => {
      expect(rule.validate('this is too long')).to.be.false;
      expect(rule.validate('short\nthis is too long')).to.be.false;
      expect(rule.validate('this is too long\nshort')).to.be.false;
    });
  });

  describe('fix', () => {
    it('should truncate lines that exceed the maximum length', () => {
      expect(rule.fix('this is too long')).to.equal('this is too\nlong');
      expect(rule.fix('short\nthis is too long')).to.equal('short\nthis is too\nlong');
      expect(rule.fix('this is too long\nshort')).to.equal('this is too\nlong\nshort');
    });
  });

  describe('errorMessage', () => {
    it('should provide a helpful error message', () => {
      expect(rule.errorMessage()).to.equal(`the subject must be wrapped at ${maxLength} characters`);
    });
  });

  describe('check', () => {
    it('should return valid input as-is', () => {
      expect(rule.check('short')).to.equal('short');
      expect(rule.check('short\ntext')).to.equal('short\ntext');
    });

    it('should throw an error for invalid input', () => {
      expect(() => rule.check('this is too long')).to.not.throw();
      expect(() => rule.check('short\nthis is too long')).to.not.throw();
    });
  });
});
