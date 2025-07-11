import type { BaseRule } from './rules/BaseRule.js';
import { MaxLengthRule } from './rules/MaxLengthRule.js';
import { MinLengthRule } from './rules/MinLengthRule.js';
import { EmptyRule } from './rules/EmptyRule.js';
import { CaseRule } from './rules/CaseRule.js';
import { EnumRule } from './rules/EnumRule.js';
import { FullStopRule } from './rules/FullStopRule.js';
import { LeadingBlankRule } from './rules/LeadingBlankRule.js';
import { MaxLineLengthRule } from './rules/MaxLineLengthRule.js';
import { TrimRule } from './rules/TrimRule.js';
import { ExclamationMarkRule } from './rules/ExclamationMarkRule.js';
import { AllowMultipleRule } from './rules/AllowMultipleRule.js';
import { type RuleConfigCondition, RuleConfigSeverity } from '@commitlint/types';
import type { CommitlintConfig } from '../config/index.js';
import capitalize from '../lib/capitalize.js';
import separate from '../lib/separate.js';
import CommitMessage, { type CommitJSON } from '../CommitMessage/index.js';
import loadConfig from '../config/index.js';

export type RulesConfig = CommitlintConfig['rules'];
export type CommitPart = 'type' | 'subject' | 'scope' | 'body' | 'footer';

export type RuleTypeWithoutValue = 'leading-blank' | 'empty' | 'trim' | 'exclamation-mark';
export type RuleTypeWithValue =
  | 'full-stop'
  | 'max-length'
  | 'min-length'
  | 'max-line-length'
  | 'case'
  | 'enum'
  | 'allow-multiple';

export type RuleType = RuleTypeWithValue | RuleTypeWithoutValue;
export type RuleString = `${CommitPart}-${RuleType}`;
export type RuleTypeString<Type extends RuleType = RuleType> = `${string}-${Type}`;

type RuleMapping = {
  'leading-blank': LeadingBlankRule;
  empty: EmptyRule;
  trim: TrimRule;
  'exclamation-mark': ExclamationMarkRule;
  'full-stop': FullStopRule;
  'max-length': MaxLengthRule;
  'min-length': MinLengthRule;
  'max-line-length': MaxLineLengthRule;
  case: CaseRule;
  enum: EnumRule;
  'allow-multiple': AllowMultipleRule;
};

// Map from rule strings to rule instances
export type Rules<T extends Partial<RulesConfig> = Partial<RulesConfig>> = {
  [K in keyof T as K extends `${infer Part}-${infer Type}`
    ? Part extends CommitPart
      ? Type extends keyof RuleMapping
        ? K
        : never
      : never
    : never]: T[K] extends undefined
    ? never
    : K extends `${string}-${infer RuleType}`
      ? RuleType extends keyof RuleMapping
        ? RuleMapping[RuleType]
        : never
      : never;
};

/**
 * For a given set of rules, group the rules that apply to the target part of the commit message to run bulk validations against.
 */
export default class RulesEngine<Config extends Rules = Rules> {
  constructor(private readonly rules: Config) {}

  private listRules(): BaseRule[] {
    return Object.values(this.rules);
  }

  /**
   * Validate an input by passing it through our rules, attempting to fix as we go, collecting any errors and warnings.
   * @param input
   * @returns {Object} - An object that tells you if the input is valid, with any warnings, or invalid, with errors and warnings.
   */
  validate(input = ''): boolean {
    for (const rule of this.listRules()) {
      const result = rule.validate(input);
      if (!result) return false;
    }
    return true;
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
   * @returns [output, errors, warnings] - The parsed input, any errors, any warnings:
   *          - Errors indicate rule violations that could not be automatically fixed
   *          - Warnings indicate rule violations that could not be automatically fixed but won't block/fail linting
   *          - Empty array indicates the input passed all rules without issues
   */
  parse(input: string): [output: string, errors: string[], warnings: string[]] {
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

    return [input, errors, warnings];
  }

  /**
   * Access all rules of type.
   * If a part is defined will only return a one rule if it exists, otherwise will find all rules.
   * @param ruleType
   * @returns
   */
  getRulesOfType<Type extends RuleType>(ruleType: Type): Extract<Config[keyof Config], RuleMapping[Type]>[] {
    const rules: Extract<Config[keyof Config], RuleMapping[Type]>[] = [];

    for (const ruleName in this.rules) {
      if (ruleName.endsWith(ruleType) && this.rules[ruleName]) {
        rules.push(this.rules[ruleName] as Extract<Config[keyof Config], RuleMapping[Type]>);
      }
    }

    return rules;
  }

  narrow(part: CommitPart): RulesEngine {
    const narrowedRules: Record<string, BaseRule> = {};

    for (const ruleName in this.rules) {
      if (ruleName.startsWith(part)) {
        narrowedRules[ruleName] = this.rules[ruleName] as BaseRule;
      }
    }

    // Return a new instance of RulesEngine filtered to the part of the commit message we're interested in.
    return new RulesEngine(narrowedRules as Rules);
  }

  /**
   * Returns an object containing arrays of required, optional, and forbidden commit properties based on the configured rules.
   *
   * @returns {Object} An object containing:
   *   - required: string[] - Array of commit parts that must be present
   *   - optional: string[] - Array of commit parts that may be included
   *   - forbidden: string[] - Array of commit parts that must not be included
   */
  allowedCommitProps(): { required: CommitPart[]; optional: CommitPart[]; forbidden: CommitPart[] } {
    const rules = this.listRules();

    // Filter out Empty rules
    const emptyRules = rules.filter(rule => rule instanceof EmptyRule);

    // Assume everything is optional unless otherwise required or forbidden
    const optional = new Set<CommitPart>(['type', 'subject', 'scope', 'body']);

    const ruleToString = (rule: BaseRule) => {
      const name = rule.name;
      optional.delete(name);
      return name;
    };

    // Separate out required and forbidden empty rules, removing from the 'optional' set
    // what's left over are optional properties and the rest are either required or forbidden from the configured rules.
    const [required, forbidden] = separate(emptyRules, rule => rule.applicable === 'never', {
      onPass: ruleToString,
      onFail: ruleToString,
    });

    return { required, optional: [...optional], forbidden };
  }

  /**
   * Returns a human readable string that describes all rules that this engine enforces.
   * @returns
   */
  describe(): string {
    const description: string[] = ['## General Rules'];

    const rules = this.listRules();

    const requiredList = new Intl.ListFormat('en-au', { type: 'conjunction', style: 'long', localeMatcher: 'best fit' });
    const optionalList = new Intl.ListFormat('en-au', { type: 'disjunction', style: 'long', localeMatcher: 'best fit' });

    // Separate out Empty rules
    const nonEmptyRules = rules.filter(rule => !(rule instanceof EmptyRule));

    const { required, optional, forbidden } = this.allowedCommitProps();

    const commitStructure: CommitJSON = {};
    const structure = [];
    // Required
    if (required.length) {
      required.forEach(rule => {
        if (rule === 'footer') {
          commitStructure[rule] = ['<Token>: <Message>', '[optional <Token>: <Message>]'];
        } else {
          commitStructure[rule] = `<${rule}>`;
        }
      });
      structure.push(`must have a ${requiredList.format(required)}`);
    }
    // Optional
    if (optional.length) {
      optional.forEach(rule => {
        if (rule === 'footer') {
          commitStructure[rule] = ['[optional <Token>: <Message>]'];
        } else {
          commitStructure[rule] = `[optional ${rule}]`;
        }
      });
      structure.push(`may have a ${optionalList.format(optional)}`);
    }
    // Forbidden
    if (forbidden.length) structure.push(`must not contain a ${optionalList.format(forbidden)}`);
    if (structure[0]) structure[0] = `Commit messages ${structure[0]}`;
    description.push(requiredList.format(structure));

    // Show what the stucture looks like.
    description.push(CommitMessage.fromJSON(commitStructure).toString());

    (['type', 'scope', 'subject', 'header', 'body', 'footer', 'trailer'] as CommitPart[]).reduce((rules, part) => {
      // find all rules for the type.
      const [applicableRules, otherRules] = separate(rules, rule => rule.name.startsWith(part));

      if (applicableRules.length) {
        description.push(`### ${capitalize(part)}`);
        description.push(...applicableRules.map(v => `- ${capitalize(v.errorMessage())}`));
      }

      // There's no "rule" for this, so it's a begrudging special case
      if (part === 'subject')
        description.push('- The subject must be written in imperative mood (Fix, not Fixed / Fixes etc.)');

      // return the other rules to continue
      return otherRules;
    }, nonEmptyRules);

    return description.join('\n');
  }

  /**
   * Create an instance of RulesEngine from a commitlint config
   */
  static async fromConfig() {
    const config = await loadConfig();
    return RulesEngine.fromRules(config.rules);
  }

  /**
   * Create an instance of RulesEngine from a commitlint config
   */
  static fromRules<const T extends Partial<RulesConfig>>(rulesConfig: T): RulesEngine<Rules<T>> {
    // It should be it's own object with set, get and list properties.

    const rules = Object.entries(rulesConfig).reduce(
      (rules, [ruleName, ruleConfig]) => {
        // Only continue if a rule matches the part we're interested in
        if (!ruleConfig) return rules;

        // Extract the rule type and commit part from the name
        // Examples:
        // 'subject-enum' => ['subject', 'enum']
        // 'header-allow-empty' => ['header', 'allow-empty']
        const [name, type] = ruleName.split(/(?<=^\w+)-/) as [CommitPart, RuleType];

        // Commitlint allows ruleConfigs to be a function, if so call it and get it's value
        const resolvedRuleConfig = ruleConfig instanceof Function ? ruleConfig() : ruleConfig;

        // Commitlint also allows functions to return promises, CBF supporting this at the moment, It would be rare to see this implemented (y tho?)
        if (resolvedRuleConfig instanceof Promise || resolvedRuleConfig[0] === RuleConfigSeverity.Disabled) return rules;

        // Load the associated rule from the rule-type
        // If we don't know about a rule, don't worry about it, we'll support one day but don't throw an error, just don't handle it
        // The linter will pick it up anyway.
        const rule = RulesEngine.createRule(name, type, resolvedRuleConfig);
        // Yes this is what we need the thing for. And if it's
        if (rule) rules[ruleName as RuleString] = rule;

        return rules;
      },
      {} as Record<RuleString, RuleMapping[RuleType]>,
    );

    return new RulesEngine(rules as Rules<T>);
  }

  static createRule<T extends RuleType>(
    ruleName: CommitPart,
    ruleType: T,
    [level, condition, value]:
      | readonly [RuleConfigSeverity, RuleConfigCondition, unknown]
      | readonly [RuleConfigSeverity, RuleConfigCondition],
  ): RuleMapping[T] | undefined {
    switch (ruleType) {
      case 'empty':
        return new EmptyRule(ruleName, level, condition) as RuleMapping[T];
      case 'max-length':
        if (typeof value !== 'number') break;
        return new MaxLengthRule(ruleName, level, condition, value) as RuleMapping[T];
      case 'min-length':
        if (typeof value !== 'number') break;
        return new MinLengthRule(ruleName, level, condition, value) as RuleMapping[T];
      case 'case': {
        const cases = !Array.isArray(value) ? [value] : value;
        if (cases.some(v => typeof v !== 'string')) break;
        return new CaseRule(ruleName, level, condition, cases) as RuleMapping[T];
      }
      case 'enum':
        if (!Array.isArray(value)) break;
        return new EnumRule(ruleName, level, condition, value) as RuleMapping[T];
      case 'full-stop':
        if (typeof value !== 'string') break;
        return new FullStopRule(ruleName, level, condition, value) as RuleMapping[T];
      case 'leading-blank':
        return new LeadingBlankRule(ruleName, level, condition) as RuleMapping[T];
      case 'max-line-length':
        if (typeof value !== 'number') break;
        return new MaxLineLengthRule(ruleName, level, condition, value) as RuleMapping[T];
      case 'trim':
        return new TrimRule(ruleName, level, condition) as RuleMapping[T];
      case 'exclamation-mark':
        return new ExclamationMarkRule(ruleName, level, condition) as RuleMapping[T];
      case 'allow-multiple':
        if (typeof value !== 'string') break;
        return new AllowMultipleRule(ruleName, level, condition, value ? value : ',') as RuleMapping[T];
    }
    return;
  }
}
