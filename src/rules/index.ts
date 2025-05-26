import type { BaseRule, RuleLevel, RuleApplicable, RuleArgs } from './BaseRule.js';
import { MaxLengthRule } from './MaxLengthRule.js';
import { MinLengthRule } from './MinLengthRule.js';
import { EmptyRule } from './EmptyRule.js';
import { CaseRule, type CaseType } from './CaseRule.js';
import { EnumRule } from './EnumRule.js';
import { FullStopRule } from './FullStopRule.js';
import { LeadingBlankRule } from './LeadingBlankRule.js';
import { MaxLineLengthRule } from './MaxLineLengthRule.js';
import { TrimRule } from './TrimRule.js';
import { ExclamationMarkRule } from './ExclamationMarkRule.js';
import { TrailerRule } from './TrailerRule.js';

export type CommitPart = 'body' | 'footer' | 'header' | 'scope' | 'type' | 'subject';
export type RuleType =
  | 'leading-blank'
  | 'full-stop'
  | 'empty'
  | 'max-length'
  | 'min-length'
  | 'max-line-length'
  | 'case'
  | 'trim'
  | 'enum'
  | 'exclamation-mark';
export type RuleString = `${CommitPart}-${RuleType}`;

export type { BaseRule, RuleLevel, RuleApplicable };

export type CommitlintConfig = {
  rules: Record<RuleString, [number, 'always' | 'never', unknown]>;
};

export default class RuleEngine {
  private rules: Map<string, BaseRule> = new Map();

  constructor(
    private readonly part: CommitPart,
    config?: CommitlintConfig,
  ) {
    if (!config) return;

    this.loadConfig(config);
  }

  loadConfig(config: CommitlintConfig): void {
    this.rules.clear();

    Object.entries(config.rules).forEach(([ruleName, ruleConfig]) => {
      // Only continue if a rule matches the part we're interested in
      if (!ruleName.startsWith(this.part)) return;

      // Extract the rule type from the name, Example: 'type-enum' => 'enum'
      const ruleType = ruleName.replace(`${this.part}-`, '') as RuleType;

      // Load the associated rule from the rule-type
      // If we don't know about a rule, don't worry about it.
      switch (ruleType) {
        case 'empty':
          return this.rules.set(ruleName, new EmptyRule(ruleConfig));
        case 'max-length':
          return this.rules.set(ruleName, new MaxLengthRule(ruleConfig as RuleArgs<number>));
        case 'min-length':
          return this.rules.set(ruleName, new MinLengthRule(ruleConfig as RuleArgs<number>));
        case 'case':
          return this.rules.set(ruleName, new CaseRule(ruleConfig as RuleArgs<CaseType>));
        case 'enum':
          return this.rules.set(ruleName, new EnumRule(ruleConfig as RuleArgs<string[]>));
        case 'full-stop':
          return this.rules.set(ruleName, new FullStopRule(ruleConfig as RuleArgs<string>));
        case 'leading-blank':
          return this.rules.set(ruleName, new LeadingBlankRule(ruleConfig));
        case 'max-line-length':
          return this.rules.set(ruleName, new MaxLineLengthRule(ruleConfig as RuleArgs<number>));
        case 'trim':
          return this.rules.set(ruleName, new TrimRule(ruleConfig));
        case 'exclamation-mark':
          return this.rules.set(ruleName, new ExclamationMarkRule(ruleConfig));
      }
    });
  }

  validate(input: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules.values()) {
      try {
        const result = rule.check(input);
        if (typeof result === 'string') input = result;
        if (result instanceof Error) warnings.push(`${result.message}`);
      } catch (error) {
        errors.push((error as Error).message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
