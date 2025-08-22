import { expect } from 'chai';
import { BaseRule, BaseRuleWithValue, RuleConfigSeverity } from './BaseRule.js';
import type { RuleScope } from '../index.js';
import type { RuleConfigCondition } from '@commitlint/types';

// Concrete test implementation of BaseRule
class TestRule extends BaseRule {
  constructor(
    scope: RuleScope,
    level: RuleConfigSeverity,
    applicable: RuleConfigCondition = 'always',
    private shouldValidate = true,
    private canFix = true,
  ) {
    super(scope, level, applicable);
  }

  validate(parts: string[]): null | Record<number, string> {
    if (this.shouldValidate) return null;
    const errs = Object.fromEntries(parts.map((_, idx) => [idx, this.describe()]));
    return Object.keys(errs).length ? errs : null;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    const fixed = this.canFix ? parts.map(part => `fixed-${part}`) : parts;
    const errors = this.validate(fixed);
    return [errors, fixed];
  }

  describe(): string {
    return `test error for ${this.scope}`;
  }
}

// Concrete test implementation of BaseRuleWithValue
class TestRuleWithValue extends BaseRuleWithValue<string> {
  validate(_parts: string[]): null | Record<number, string> {
    return null;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    return [null, parts];
  }

  describe(): string {
    return 'TestRuleWithValue';
  }
}

describe('BaseRule', () => {
  describe('Constructor', () => {
    it('should set properties correctly', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Error, 'never');
      expect(rule.scope).to.equal('subject');
      // biome-ignore lint/suspicious/noExplicitAny: masking as any to get around 'protected' property type
      expect((rule as any).level).to.equal(RuleConfigSeverity.Error);
      expect(rule.applicable).to.equal('never');
    });

    it('should default applicable to always', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Error);
      expect(rule.applicable).to.equal('always');
    });
  });

  describe('validate', () => {
    it('should return null when shouldValidate is true', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Error, 'always', true);
      const result = rule.validate(['test', 'parts']);
      expect(result).to.be.null;
    });

    it('should return error mapping when shouldValidate is false', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Error, 'always', false);
      const result = rule.validate(['test', 'parts']);
      expect(result).to.deep.equal({ 0: 'Test error for subject', 1: 'Test error for subject' });
    });
  });

  describe('fix', () => {
    it('should return fixed parts when canFix is true', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Error, 'always', true, true);
      const [errors, fixed] = rule.fix(['test', 'parts']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['fixed-test', 'fixed-parts']);
    });

    it('should return original parts when canFix is false', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Error, 'always', true, false);
      const original = ['test', 'parts'];
      const [errors, fixed] = rule.fix(original);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(original);
    });
  });

  describe('check method', () => {
    it('should return original input when level is Disabled', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Disabled, 'always', false);
      const [output, errors, warnings] = rule.check(['test']);
      expect(output).to.deep.equal(['test']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should return original input when validate passes', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Error, 'always', true);
      const [output, errors, warnings] = rule.check(['test']);
      expect(output).to.deep.equal(['test']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should return fixed output when validate fails but fix succeeds', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Error, 'always', false, true);
      const [output, errors, warnings] = rule.check(['test']);
      expect(output).to.deep.equal(['fixed-test']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });

    it('should return warnings when level is Warning and fix fails', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Warning, 'always', false, false);
      const [output, errors, warnings] = rule.check(['test']);
      expect(output).to.deep.equal(['test']);
      expect(errors).to.be.null;
      expect(warnings).to.deep.equal({ 0: 'Test error for subject' });
    });

    it('should return errors when level is Error and fix fails', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Error, 'always', false, false);
      const [output, errors, warnings] = rule.check(['test']);
      expect(output).to.deep.equal(['test']);
      expect(errors).to.deep.equal({ 0: 'Test error for subject' });
      expect(warnings).to.be.null;
    });

    it('should skip fix when fix parameter is false', () => {
      const rule = new TestRule('subject', RuleConfigSeverity.Error, 'always', false, true);
      const [output, errors, warnings] = rule.check(['test'], false);
      expect(output).to.deep.equal(['test']);
      expect(errors).to.deep.equal({ 0: 'Test error for subject' });
      expect(warnings).to.be.null;
    });
  });

  describe('BaseRuleWithValue', () => {
    it('should set value property correctly', () => {
      const rule = new TestRuleWithValue('subject', RuleConfigSeverity.Error, 'always', 'test-value');
      expect(rule.value).to.equal('test-value');
    });

    it('should inherit all BaseRule functionality', () => {
      const rule = new TestRuleWithValue('subject', RuleConfigSeverity.Error, 'always', 'test-value');
      expect(rule.scope).to.equal('subject');
      // biome-ignore lint/suspicious/noExplicitAny: masking as any to get around 'protected' property type
      expect((rule as any).level).to.equal(RuleConfigSeverity.Error);
      expect(rule.applicable).to.equal('always');
      const [output, errors, warnings] = rule.check(['test']);
      expect(output).to.deep.equal(['test']);
      expect(errors).to.be.null;
      expect(warnings).to.be.null;
    });
  });
});
