import { expect } from 'chai';
import { ExclamationMarkRule } from './ExclamationMarkRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('ExclamationMarkRule', () => {
  it('should validate when input contains !:', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    expect(rule.validate(['feat!: add new feature'])).to.be.null;
  });

  it('should not validate when input does not contain !:', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    expect(rule.validate(['feat: add new feature'])).to.deep.equal({ 0: 'the subject must have an exclamation mark before the colon' });
  });

  it('should fix by adding ! before : when applicable is always', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    const [errors, fixed] = rule.fix(['feat: add new feature']);
    expect(errors).to.be.null;
    expect(fixed).to.deep.equal(['feat!: add new feature']);
  });

  it('should fix by removing ! before : when applicable is never', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'never');
    const [errors, fixed] = rule.fix(['feat!: add new feature']);
    expect(errors).to.be.null;
    expect(fixed).to.deep.equal(['feat: add new feature']);
  });

  it('should return errors when fix is not possible', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    const [errors, fixed] = rule.fix(['no colon here']);
    expect(errors).to.deep.equal({ 0: 'the subject must have an exclamation mark before the colon' });
    expect(fixed).to.deep.equal(['no colon here']);
  });



  it('should handle check method correctly', () => {
    const alwaysRule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    
    // Valid input
    const [output1, errors1, warnings1] = alwaysRule.check(['feat!: add new feature']);
    expect(output1).to.deep.equal(['feat!: add new feature']);
    expect(errors1).to.be.null;
    expect(warnings1).to.be.null;
    
    // Invalid input that can be fixed
    const [output2, errors2, warnings2] = alwaysRule.check(['feat: add new feature']);
    expect(output2).to.deep.equal(['feat!: add new feature']);
    expect(errors2).to.be.null;
    expect(warnings2).to.be.null;

    // Never rule with valid input
    const neverRule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'never');
    const [output3, errors3, warnings3] = neverRule.check(['feat: add new feature']);
    expect(output3).to.deep.equal(['feat: add new feature']);
    expect(errors3).to.be.null;
    expect(warnings3).to.be.null;
  });
});
