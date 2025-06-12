import { expect } from 'chai';
import { LeadingBlankRule } from './LeadingBlankRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('LeadingBlankRule', () => {
  describe('validate()', () => {
    it('should validate when input begins with a blank line', () => {
      const rule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      expect(rule.validate('\nThis is a message')).to.be.true;
      expect(rule.validate('  \nThis is a message')).to.be.true;
    });

    it('should not validate when input does not begin with a blank line', () => {
      const rule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      expect(rule.validate('This is a message')).to.be.false;
      expect(rule.validate('This is a message\nWith multiple lines')).to.be.false;
    });
  });

  describe('fix()', () => {
    it('should fix by adding a blank line when applicable is always', () => {
      const rule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      expect(rule.fix('This is a message')).to.equal('\nThis is a message');
    });

    it('should fix by removing the blank line when applicable is never', () => {
      const rule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'never');
      expect(rule.fix('\nThis is a message')).to.equal('This is a message');
      expect(rule.fix('  \nThis is a message')).to.equal('This is a message');
    });

    it('should return null when fix is not needed', () => {
      const alwaysRule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      expect(alwaysRule.fix('\nThis is a message')).to.be.null;

      const neverRule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'never');
      expect(neverRule.fix('This is a message')).to.be.null;
    });
  });

  describe('errorMessage()', () => {
    it('should provide a helpful error message for always condition', () => {
      const alwaysRule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      expect(alwaysRule.errorMessage()).to.equal('the subject must always begin with a blank line');
    });

    it('should provide a helpful error message for never condition', () => {
      const neverRule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'never');
      expect(neverRule.errorMessage()).to.equal('the subject must never begin with a blank line');
    });
  });

  describe('check()', () => {
    it('should handle check method correctly for always condition', () => {
      const alwaysRule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      expect(alwaysRule.check('\nThis is a message')).to.equal('\nThis is a message');
      expect(() => alwaysRule.check('This is a message')).to.not.throw(); // it heals itself.
    });

    it('should handle check method correctly for never condition', () => {
      const neverRule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'never');
      expect(neverRule.check('This is a message')).to.equal('This is a message');
      expect(() => neverRule.check('\nThis is a message')).to.not.throw(); // it heals itself.
    });
  });
});
