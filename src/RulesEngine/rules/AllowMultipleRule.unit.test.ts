import { expect } from 'chai';
import { AllowMultipleRule } from './AllowMultipleRule.js';
import { RuleConfigSeverity } from '@commitlint/types';

describe('AllowMultipleRule', () => {
  const delimiter = ',';

  describe('validate - always', () => {
    let rule: AllowMultipleRule;

    beforeEach(() => {
      rule = new AllowMultipleRule('subject', RuleConfigSeverity.Error, 'always', delimiter);
    });

    it('should always validate with always condition', () => {
      expect(rule.validate(['item1'])).to.be.null;
      expect(rule.validate(['item1', 'item2'])).to.be.null;
      expect(rule.validate(['item1', 'item2', 'item3'])).to.be.null;
    });

    it('should validate when input is empty', () => {
      expect(rule.validate([''])).to.be.null;
    });
  });

  describe('validate - never', () => {
    let rule: AllowMultipleRule;

    beforeEach(() => {
      rule = new AllowMultipleRule('subject', RuleConfigSeverity.Error, 'never', delimiter);
    });

    it('should validate when input contains only one item', () => {
      expect(rule.validate(['item1'])).to.be.null;
    });

    it('should not validate when input contains multiple items', () => {
      expect(rule.validate(['item1', 'item2'])).to.deep.equal({ 1: "Multiple subjects aren't allowed" });
      expect(rule.validate(['item1', 'item2', 'item3'])).to.deep.equal({ 1: "Multiple subjects aren't allowed", 2: "Multiple subjects aren't allowed" });
    });
  });

  describe('fix', () => {
    it('should return false for always condition', () => {
      const rule = new AllowMultipleRule('subject', RuleConfigSeverity.Error, 'always', delimiter);

      const [singleErr, singleFixed] = rule.fix(['item1']);
      expect(singleErr).to.be.null;
      expect(singleFixed).to.deep.equal(['item1'])

      const [multipleErr, multipleFixed] = rule.fix(['item1', 'item2']);
      expect(multipleErr).to.be.null;
      expect(multipleFixed).to.deep.equal(['item1', 'item2'])
    });

    it('should return only the first item for never condition', () => {
      const rule = new AllowMultipleRule('subject', RuleConfigSeverity.Error, 'never', delimiter);

      const [err, fixed] = rule.fix(['item1', 'item2', 'item3']);
      expect(err).to.be.null;
      expect(fixed).to.be.an('array').that.has.lengthOf(1).and.to.deep.equal(['item1']);
    });
  });

  describe('errorMessage', () => {
    it('should provide a helpful error message', () => {
      const rule = new AllowMultipleRule('subject', RuleConfigSeverity.Error, 'never', delimiter);
      expect(rule.validate(['subject1', 'subject2'])).to.deep.equal({ 1: "Multiple subjects aren't allowed" });
    });
  });

  describe('check', () => {
    it('should return null for always condition', () => {
      const rule = new AllowMultipleRule('subject', RuleConfigSeverity.Error, 'always', delimiter);

      const [multiple, errorsMultiple, warningsMultiple] = rule.check(['item1', 'item2'])
      expect(multiple).to.deep.equal(['item1', 'item2']);
      expect(errorsMultiple).to.be.null;
      expect(warningsMultiple).to.be.null; 

      const [single, errorsSingle, warningsSingle] = rule.check(['item1'])
      expect(single).to.deep.equal(['item1']);
      expect(errorsSingle).to.be.null;
      expect(warningsSingle).to.be.null; 

    });

    it('should return null for valid never condition', () => {
      const rule = new AllowMultipleRule('subject', RuleConfigSeverity.Error, 'never', delimiter);

      const [passthrough, errors, warnings] = rule.check(['item1']);

      expect(passthrough).to.deep.equal(['item1']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should heal lists with multiple items by reducing them to one for never condition', () => {
      const rule = new AllowMultipleRule('subject', RuleConfigSeverity.Error, 'never', delimiter);

      const [output, errs, warnings] = rule.check(['item1', 'item2']);
      expect(output).to.be.deep.equal(['item1']);
      expect(errs).to.be.null;
      expect(warnings).to.be.null;
    });
  });
});
