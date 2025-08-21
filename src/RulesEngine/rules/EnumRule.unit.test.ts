import { EnumRule } from './EnumRule.js';
import { RuleConfigSeverity } from '@commitlint/types';
import { expect } from 'chai';

describe('EnumRule', () => {
  const allowedValues = ['feat', 'fix', 'docs', 'style', 'refactor'];

  it('should validate when input is in the allowed values', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'always', allowedValues);
    expect(rule.validate(['feat'])).to.be.null;
    expect(rule.validate(['fix'])).to.be.null;
  });

  it('should not validate when input is not in the allowed values', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'always', allowedValues);
    expect(rule.validate(['build'])).to.deep.equal({
      0: "the subject can only be one of: 'feat', 'fix', 'docs', 'style' or 'refactor'",
    });
    expect(rule.validate(['unknown'])).to.deep.equal({
      0: "the subject can only be one of: 'feat', 'fix', 'docs', 'style' or 'refactor'",
    });
  });

  it('should not fix invalid inputs', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'always', allowedValues);
    const [errors, fixed] = rule.fix(['build']);
    expect(errors).to.deep.equal({ 0: "the subject can only be one of: 'feat', 'fix', 'docs', 'style' or 'refactor'" });
    expect(fixed).to.deep.equal(['build']);
  });

  it('should provide a helpful error message - applicable: never', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'never', allowedValues);
    const error = rule.validate(['feat']);
    expect(error).to.deep.equal({ 0: `the subject can\'t be any of: 'feat', 'fix', 'docs', 'style' or 'refactor'` });
  });

  it('should handle check method correctly', () => {
    const rule = new EnumRule('subject', RuleConfigSeverity.Error, 'always', allowedValues);

    // Valid input
    const [output1, errors1, warnings1] = rule.check(['feat']);
    expect(output1).to.deep.equal(['feat']);
    expect(errors1).to.be.null;
    expect(warnings1).to.be.null;

    // Invalid input with fix disabled
    const [output2, errors2, warnings2] = rule.check(['unknown'], false);
    expect(output2).to.deep.equal(['unknown']);
    expect(errors2).to.deep.equal({ 0: "the subject can only be one of: 'feat', 'fix', 'docs', 'style' or 'refactor'" });
    expect(warnings2).to.be.null;
  });
});
