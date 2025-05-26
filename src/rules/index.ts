import type { BaseRule } from './BaseRule.js';
import { MaxLengthRule } from './MaxLengthRule.js';
import { MinLengthRule } from './MinLengthRule.js';
import { EmptyRule } from './EmptyRule.js';
import { CaseRule } from './CaseRule.js';
import { EnumRule } from './EnumRule.js';
import { FullStopRule } from './FullStopRule.js';
import { LeadingBlankRule } from './LeadingBlankRule.js';
import { MaxLineLengthRule } from './MaxLineLengthRule.js';
import { TrimRule } from './TrimRule.js';
import { ExclamationMarkRule } from './ExclamationMarkRule.js';
import { RuleConfigSeverity, RulesConfig } from '@commitlint/types';

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

/**
 * For a given set of rules, group the rules that apply to the target part of the commit message to run bulk validations against.
 */
export default class RuleEngine {
  private rules: Map<string, BaseRule> = new Map();

  constructor(
    private readonly part: CommitPart,
    rules: Partial<RulesConfig>,
  ) {
    Object.entries(rules).forEach(([ruleName, ruleConfig]) => {
      // Only continue if a rule matches the part we're interested in
      if (!ruleName.startsWith(this.part) || !ruleConfig) return;

      // Extract the rule type from the name, Example: 'subject-enum' => 'enum', 'header-case' => 'case'
      const ruleType = ruleName.replace(`${this.part}-`, '') as RuleType;

      // Commitlint allows ruleConfigs to be a function, if so call it and get it's value
      const resolvedRuleConfig = ruleConfig instanceof Function ? ruleConfig() : ruleConfig;

      // Commitlint also allows functions to return promises, CBF supporting this at the moment, It would be rare to see this implemented (y tho?)
      if (resolvedRuleConfig instanceof Promise || resolvedRuleConfig[0] === RuleConfigSeverity.Disabled) return;

      // Load the associated rule from the rule-type
      // If we don't know about a rule, don't worry about it, we'll support one day but don't throw an error, just don't handle it
      // The linter will pick it up anyway.
      const [level, condition, value] = resolvedRuleConfig;

      switch (ruleType) {
        case 'empty':
          return this.rules.set(ruleName, new EmptyRule(level, condition));
        case 'max-length':
          if (typeof value !== 'number') return;
          return this.rules.set(ruleName, new MaxLengthRule(level, condition, value));
        case 'min-length':
          if (typeof value !== 'number') return;
          return this.rules.set(ruleName, new MinLengthRule(level, condition, value));
        case 'case':
          const cases = !Array.isArray(value) ? [value] : value;
          if (cases.some(v => typeof v !== 'string')) return;

          return this.rules.set(ruleName, new CaseRule(level, condition, cases));
        case 'enum':
          if (!Array.isArray(value)) return;
          return this.rules.set(ruleName, new EnumRule(level, condition, value));
        case 'full-stop':
          if (typeof value !== 'string') return;
          return this.rules.set(ruleName, new FullStopRule(level, condition, value));
        case 'leading-blank':
          return this.rules.set(ruleName, new LeadingBlankRule(level, condition));
        case 'max-line-length':
          if (typeof value !== 'number') return;
          return this.rules.set(ruleName, new MaxLineLengthRule(level, condition, value));
        case 'trim':
          return this.rules.set(ruleName, new TrimRule(level, condition));
        case 'exclamation-mark':
          return this.rules.set(ruleName, new ExclamationMarkRule(level, condition));
      }
    });
  }

  /**
   * Validate an input by passing it through our rules, attempting to fix as we go, collecting any errors and warnings.
   * @param input 
   * @returns {Object} - An object that tells you if the input is valid, with any warnings, or invalid, with errors and warnings.
   */
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

  /**
   * Parses the raw user input one by one through our rules and attempts to fix them if they fail validation.
   * The output will be a string that complies with all rules as much as possible without human intervention.
   * 
   * A simple example would be a rule that requires all upper-case and maximum character limit.
   * The output would always be upper-case trimmed to the character limit.
   * 
   * The same can't be said for a minimum character limit as we don't know what to 'add' to bring it to the limit
   * @param input - the raw user input
   * @returns {string} - the fixed / mended input, if it could be fixed by the imposing rules.
   */
  parse(input: string): string {
    for (const rule of this.rules.values()) {
      try {
        const result = rule.check(input);
        if (typeof result === 'string') input = result;
      } catch (error) {
        // Catch the error. do nothing with it.
      }
    }
    return input;
  }
}
