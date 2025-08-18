import { expect } from 'chai';
import { LeadingBlankRule } from './LeadingBlankRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('LeadingBlankRule', () => {
  describe('validate()', () => {
    it('should validate when input begins with a blank line', () => {
      const rule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      expect(rule.validate(['\nThis is a message'])).to.be.null;
      expect(rule.validate(['  \nThis is a message'])).to.be.null;
    });

    it('should not validate when input does not begin with a blank line', () => {
      const rule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      expect(rule.validate(['This is a message'])).to.deep.equal({ 0: 'the subject must always begin with a blank line' });
      expect(rule.validate(['This is a message\nWith multiple lines'])).to.deep.equal({ 0: 'the subject must always begin with a blank line' });
    });
  });

  describe('fix()', () => {
    it('should fix by adding a blank line when applicable is always', () => {
      const rule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      const [errors, fixed] = rule.fix(['This is a message']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['\nThis is a message']);
    });

    it('should fix by removing the blank line when applicable is never', () => {
      const rule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'never');
      
      const [errors1, fixed1] = rule.fix(['\nThis is a message']);
      expect(errors1).to.be.null;
      expect(fixed1).to.deep.equal(['This is a message']);
      
      const [errors2, fixed2] = rule.fix(['  \nThis is a message']);
      expect(errors2).to.be.null;
      expect(fixed2).to.deep.equal(['This is a message']);
    });

    it('should return null when fix is not needed', () => {
      const alwaysRule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      const [errors1, fixed1] = alwaysRule.fix(['\nThis is a message']);
      expect(errors1).to.be.null;
      expect(fixed1).to.deep.equal(['\nThis is a message']);

      const neverRule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'never');
      const [errors2, fixed2] = neverRule.fix(['This is a message']);
      expect(errors2).to.be.null;
      expect(fixed2).to.deep.equal(['This is a message']);
    });
  });

  describe('check()', () => {
    it('should handle check method correctly for always condition', () => {
      const alwaysRule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'always');
      
      // Valid input
      const [output1, errors1, warnings1] = alwaysRule.check(['\nThis is a message']);
      expect(output1).to.deep.equal(['\nThis is a message']);
      expect(errors1).to.be.null;
      expect(warnings1).to.be.null;
      
      // Invalid input that gets fixed
      const [output2, errors2, warnings2] = alwaysRule.check(['This is a message']);
      expect(output2).to.deep.equal(['\nThis is a message']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });

    it('should handle check method correctly for never condition', () => {
      const neverRule = new LeadingBlankRule('subject', RuleConfigSeverity.Error, 'never');
      
      // Valid input
      const [output1, errors1, warnings1] = neverRule.check(['This is a message']);
      expect(output1).to.deep.equal(['This is a message']);
      expect(errors1).to.be.null;
      expect(warnings1).to.be.null;
      
      // Invalid input that gets fixed
      const [output2, errors2, warnings2] = neverRule.check(['\nThis is a message']);
      expect(output2).to.deep.equal(['This is a message']);
      expect(errors2).to.be.null;
      expect(warnings2).to.be.null;
    });
  });
});
