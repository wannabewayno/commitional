import { EnumRule } from './EnumRule.js';
import { RuleConfigSeverity } from '@commitlint/types';
import { expect } from 'chai';

describe('EnumRule', () => {
  const allowedValues = ['feat', 'fix', 'docs', 'style', 'refactor'];

  it('should validate when input is in the allowed values', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'always', allowedValues);
    expect(rule.validate('feat')).to.equal(true);
    expect(rule.validate('fix')).to.equal(true);
  });

  it('should not validate when input is not in the allowed values', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'always', allowedValues);
    expect(rule.validate('build')).to.equal(false);
    expect(rule.validate('unknown')).to.equal(false);
  });

  it('should not fix invalid inputs', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'always', allowedValues);
    expect(rule.fix('build')).to.be.null;
  });

  it('should provide a helpful error message - applicable: never', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'never', allowedValues);
    const error = rule.errorMessage();
    expect(error).to.equal(`the subject can\'t be any of: 'feat', 'fix', 'docs', 'style' or 'refactor'`);
  });

  it('should provide a helpful error message - applicable: always', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'always', allowedValues);
    const error = rule.errorMessage();
    expect(error).to.equal(`the subject can only be one of: 'feat', 'fix', 'docs', 'style' or 'refactor'`);
  });

  it('should handle check method correctly', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'always', allowedValues);
    expect(rule.check('feat')).to.equal('feat'); // Valid input returns the input
    expect(() => rule.check('unknown')).to.throw(); // Invalid input returns an error
  });
});
