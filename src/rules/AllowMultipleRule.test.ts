import { expect } from 'chai';
import { AllowMultipleRule } from './AllowMultipleRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('AllowMultipleRule', () => {
  const delimiter = ',';

  describe('validate - always', () => {
    let rule: AllowMultipleRule;

    beforeEach(() => {
      rule = new AllowMultipleRule(RuleConfigSeverity.Error, 'always', delimiter);
    });

    it('should always validate with always condition', () => {
      expect(rule.validate('item1,item2')).to.be.true;
      expect(rule.validate('item1')).to.be.true;
      expect(rule.validate('item1,item2,item3')).to.be.true;
    });

    it('should validate when input is empty', () => {
      expect(rule.validate('')).to.be.true;
    });
  });

  describe('validate - never', () => {
    let rule: AllowMultipleRule;

    beforeEach(() => {
      rule = new AllowMultipleRule(RuleConfigSeverity.Error, 'never', delimiter);
    });

    it('should validate when input contains only one item', () => {
      expect(rule.validate('item1')).to.be.true;
    });

    it('should not validate when input contains multiple items', () => {
      expect(rule.validate('item1,item2')).to.be.false;
      expect(rule.validate('item1,item2,item3')).to.be.false;
    });
  });

  describe('fix', () => {
    it('should return input as-is for always condition', () => {
      const rule = new AllowMultipleRule(RuleConfigSeverity.Error, 'always', delimiter);
      expect(rule.fix('item1')).to.equal('item1');
      expect(rule.fix('item1,item2')).to.equal('item1,item2');
    });

    it('should return only the first item for never condition', () => {
      const rule = new AllowMultipleRule(RuleConfigSeverity.Error, 'never', delimiter);
      expect(rule.fix('item1,item2')).to.equal('item1');
      expect(rule.fix('item1,item2,item3')).to.equal('item1');
    });
  });

  describe('errorMessage', () => {
    it('should provide a helpful error message', () => {
      const rule = new AllowMultipleRule(RuleConfigSeverity.Error, 'never', delimiter);
      expect(rule.errorMessage()).to.equal("Multiple aren't allowed");
    });
  });

  describe('check', () => {
    it('should return valid input as-is for always condition', () => {
      const rule = new AllowMultipleRule(RuleConfigSeverity.Error, 'always', delimiter);
      expect(rule.check('item1,item2')).to.equal('item1,item2');
      expect(rule.check('item1')).to.equal('item1');
    });

    it('should return valid input as-is for never condition', () => {
      const rule = new AllowMultipleRule(RuleConfigSeverity.Error, 'never', delimiter);
      expect(rule.check('item1')).to.equal('item1');
    });

    it('should heal lists with multiple items by reducing them to one for never condition', () => {
      const rule = new AllowMultipleRule(RuleConfigSeverity.Error, 'never', delimiter);
      const result = rule.check('item1,item2');
      expect(rule.check('item1,item2')).to.equal('item1');
    });
  });
});
