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
import { type RuleConfigCondition, RuleConfigSeverity, type RulesConfig } from '@commitlint/types';

export type CommitPart = 'body' | 'footer' | 'header' | 'scope' | 'type' | 'subject';

export type RuleTypeWithoutValue =   | 'leading-blank'
  | 'empty'
  | 'trim'
  | 'exclamation-mark'
export type RuleTypeWithValue = 
  | 'full-stop'
  | 'max-length'
  | 'min-length'
  | 'max-line-length'
  | 'case'
  | 'enum'

export type RuleType = RuleTypeWithValue | RuleTypeWithoutValue
export type RuleString = `${CommitPart}-${RuleType}`;

type RuleMapping = {
  "leading-blank": LeadingBlankRule,
  "empty": EmptyRule,
  "trim": TrimRule,
  "exclamation-mark": ExclamationMarkRule,
  "full-stop": FullStopRule,
  "max-length": MaxLengthRule,
  "min-length": MinLengthRule,
  "max-line-length": MaxLineLengthRule,
  "case": CaseRule,
  "enum": EnumRule,
}

// Now I can create the more generic rule.
type Rules<T extends Partial<RulesConfig> = RulesConfig> = {
  [K in keyof T]: K extends `${string}-${infer RuleType}`
    ? T[K] extends undefined
      ? never
      : RuleType extends keyof RuleMapping
        ? RuleMapping[RuleType]
        : never
    : never
}

/**
 * For a given set of rules, group the rules that apply to the target part of the commit message to run bulk validations against.
 */
export default class RuleEngine<
  Config extends Rules<Partial<RulesConfig>>,
  T extends CommitPart | undefined = undefined
> {

  constructor(
    private readonly rules: Config,
    private readonly part?: T,
  ) {}

  private listRules(): BaseRule[] {
    return Object.values(this.rules);
  }

  /**
   * Validate an input by passing it through our rules, attempting to fix as we go, collecting any errors and warnings.
   * @param input 
   * @returns {Object} - An object that tells you if the input is valid, with any warnings, or invalid, with errors and warnings.
   */
  validate(input?: string): boolean {
    if (!input) return false;
    for (const rule of this.listRules()) {
      try {
        const result = rule.check(input);
        if (result instanceof Error) return false;
      } catch (error) {
        return false;
      }
    }
    return true;
  }

  /**
   * Combination of parse() and validate()
   */
  check(input: string): string[] {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.listRules()) {
      try {
        const result = rule.check(input);
        if (typeof result === 'string') input = result;
        if (result instanceof Error) warnings.push(`${result.message}`);
      } catch (error) {
        errors.push((error as Error).message);
      }
    }

    return errors.concat(warnings)
  }

  /**
   * Access all rules of type.
   * If a part is defined will only return a one rule if it exists, otherwise will find all rules.
   * @param ruleType 
   * @returns 
   */
  getRulesOfType<Type extends RuleType>(ruleType: Type): T extends CommitPart ?  Rules[`${T}-${Type}`] | null : Rules[Type][] {
    if (this.part) {
      const ruleString = `${this.part}-${ruleType}`;
      const rule = this.rules[ruleString];
      return (rule ?? null) as T extends CommitPart ? Rules[`${T}-${Type}`] | null : Rules[Type][];
    }

    const rules: Rules[`${string}-${Type}`][] = [];
    for (const ruleName in this.rules) {
      if (ruleName.endsWith(ruleType) && this.rules[ruleName]) rules.push(this.rules[ruleName]);
    }
    return rules as T extends CommitPart ?  Rules[`${T}-${Type}`] | null :  Rules[Type][];
  }

  narrow<P extends CommitPart>(part: P): T extends undefined ? RuleEngine<{}, P> : never {
    if (this.part) throw new Error('Already narrowed!');

    const narrowedRules: Partial<Record<`${P}-${RuleType}`, RuleMapping[RuleType]>> = {};

    for (const ruleName in this.rules) {
      if (ruleName.startsWith(part)) narrowedRules[ruleName as `${P}-${RuleType}`] = this.rules[ruleName];
    }

    // Grab the part from our rules.
    return new RuleEngine(narrowedRules, part) as T extends undefined ? RuleEngine<P> : never;
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
    for (const rule of this.listRules()) {
      try {
        const result = rule.check(input);
        if (typeof result === 'string') input = result;
      } catch (error) {
        // Catch the error. do nothing with it.
      }
    }
    return input;
  }

  /* 
    I have a mapping of 
    [Part-Type]: tuples => [Part]: { [Type]: BaseRule|BaseRuleWithValue }
  */

  /**
   * Create an instance of RulesEngine from a commitlint config
   */
  static fromConfig<const T extends Partial<RulesConfig>>(rulesConfig: T): Rules<T> {
    // It should be it's own object with set, get and list properties.

    const rules = Object.entries(rulesConfig).reduce((rules, [ruleName, ruleConfig]) => {
      // Only continue if a rule matches the part we're interested in
      if (!ruleConfig) return rules;

      // Extract the rule type from the name, Example: 'subject-enum' => 'enum', 'header-case' => 'case'
      const ruleType = ruleName.replace(/^\w+-/,'') as RuleType;

      // Commitlint allows ruleConfigs to be a function, if so call it and get it's value
      const resolvedRuleConfig = ruleConfig instanceof Function ? ruleConfig() : ruleConfig;

      // Commitlint also allows functions to return promises, CBF supporting this at the moment, It would be rare to see this implemented (y tho?)
      if (resolvedRuleConfig instanceof Promise || resolvedRuleConfig[0] === RuleConfigSeverity.Disabled) return rules;

      // Load the associated rule from the rule-type
      // If we don't know about a rule, don't worry about it, we'll support one day but don't throw an error, just don't handle it
      // The linter will pick it up anyway.
      const rule = RuleEngine.createRule(ruleType, resolvedRuleConfig);
      // Yes this is what we need the thing for. And if it's 
      if (rule) rules[ruleName as RuleString] = rule;

      return rules;
    }, {} as Record<RuleString, RuleMapping[RuleType]>);

    return rules as Rules<T>;
  }

  static createRule<T extends RuleType>(ruleType: T, [level, condition, value]: readonly [RuleConfigSeverity, RuleConfigCondition, unknown] | readonly [RuleConfigSeverity, RuleConfigCondition]): RuleMapping[T] | undefined {
      switch (ruleType) {
        case 'empty':
          return new EmptyRule(level, condition) as RuleMapping[T];
        case 'max-length':
          if (typeof value !== 'number') break;
          return new MaxLengthRule(level, condition, value) as RuleMapping[T];
        case 'min-length':
          if (typeof value !== 'number') break;
          return new MinLengthRule(level, condition, value) as RuleMapping[T];
        case 'case': {
          const cases = !Array.isArray(value) ? [value] : value;
          if (cases.some(v => typeof v !== 'string')) break;
          return new CaseRule(level, condition, cases) as RuleMapping[T];
        }
        case 'enum':
          if (!Array.isArray(value)) break;
          return new EnumRule(level, condition, value) as RuleMapping[T];
        case 'full-stop':
          if (typeof value !== 'string') break;
          return new FullStopRule(level, condition, value) as RuleMapping[T];
        case 'leading-blank':
          return new LeadingBlankRule(level, condition) as RuleMapping[T];
        case 'max-line-length':
          if (typeof value !== 'number') break;
          return new MaxLineLengthRule(level, condition, value) as RuleMapping[T];
        case 'trim':
          return new TrimRule(level, condition) as RuleMapping[T];
        case 'exclamation-mark':
          return new ExclamationMarkRule(level, condition) as RuleMapping[T];
      }
    return;
  }
}

const rules = RuleEngine.fromConfig({ 'body-case': [2, 'always', 'camel-case'] });
