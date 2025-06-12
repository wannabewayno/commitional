import { expect } from 'chai';
import { ExclamationMarkRule } from './ExclamationMarkRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('ExclamationMarkRule', () => {
  it('should validate when input contains !:', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    expect(rule.validate('feat!: add new feature')).to.be.true;
  });

  it('should not validate when input does not contain !:', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    expect(rule.validate('feat: add new feature')).to.be.false;
  });

  it('should fix by adding ! before : when applicable is always', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    expect(rule.fix('feat: add new feature')).to.equal('feat!: add new feature');
  });

  it('should fix by removing ! before : when applicable is never', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'never');
    expect(rule.fix('feat!: add new feature')).to.equal('feat: add new feature');
  });

  it('should return null when fix is not possible', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    expect(rule.fix('no colon here')).to.be.null;
  });

  it('should provide a helpful error message', () => {
    const rule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    expect(rule.errorMessage()).to.match(/have an exclamation mark before the colon/);
  });

  it('should handle check method correctly', () => {
    const alwaysRule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'always');
    expect(alwaysRule.check('feat!: add new feature')).to.equal('feat!: add new feature'); // Valid input returns the input
    expect(() => alwaysRule.check('feat add new feature')).to.throw(); // Invalid input returns an error

    const neverRule = new ExclamationMarkRule('subject', RuleConfigSeverity.Error, 'never');
    expect(neverRule.check('feat: add new feature')).to.equal('feat: add new feature'); // Valid input returns the input
  });
});
