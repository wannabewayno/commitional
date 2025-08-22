import { expect } from 'chai';
import { MinLengthRule } from './MinLengthRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('MinLengthRule', () => {
  const minLength = 10;
  let rule: MinLengthRule;

  beforeEach(() => {
    rule = new MinLengthRule('subject', RuleConfigSeverity.Error, 'always', minLength);
  });

  describe('validate', () => {
    it('should validate when input meets or exceeds minimum length', () => {
      expect(rule.validate(['exactly 10'])).to.be.null;
      expect(rule.validate(['this is longer than minimum'])).to.be.null;
    });

    it('should not validate when input is shorter than minimum length', () => {
      expect(rule.validate(['too short'])).to.deep.equal({ 0: 'The subject must be at least 10 characters' });
      expect(rule.validate(['short'])).to.deep.equal({ 0: 'The subject must be at least 10 characters' });
    });
  });

  describe('fix', () => {
    it('should return errors as minimum length issues cannot be automatically fixed', () => {
      const [errors1, fixed1] = rule.fix(['too short']);
      expect(errors1).to.deep.equal({ 0: 'The subject must be at least 10 characters' });
      expect(fixed1).to.deep.equal(['too short']);

      const [errors2, fixed2] = rule.fix(['this is longer than minimum']);
      expect(errors2).to.be.null;
      expect(fixed2).to.deep.equal(['this is longer than minimum']);
    });
  });

  describe('check', () => {
    it('should return null for valid input', () => {
      const [output1, errors1, warnings1] = rule.check(['exactly 10']);
      expect(output1).to.deep.equal(['exactly 10']);
      expect(errors1).to.be.null;
      expect(warnings1).to.be.null;

      const [output2, errors2, warnings2] = rule.check(['this is longer than minimum']);
      expect(output2).to.deep.equal(['this is longer than minimum']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });

    it('should return errors for invalid input', () => {
      const [output1, errors1, warnings1] = rule.check(['too short'], false);
      expect(output1).to.deep.equal(['too short']);
      expect(errors1).to.deep.equal({ 0: 'The subject must be at least 10 characters' });
      expect(warnings1).to.be.null;

      const [output2, errors2, warnings2] = rule.check(['short'], false);
      expect(output2).to.deep.equal(['short']);
      expect(errors2).to.deep.equal({ 0: 'The subject must be at least 10 characters' });
      expect(warnings2).to.be.null;
    });
  });
});
