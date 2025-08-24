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
import { ExistsRule } from './rules/ExistsRule.js';
import { type RuleConfigCondition, RuleConfigSeverity } from '@commitlint/types';
import type { CommitlintConfig } from '../config/index.js';
import capitalize from '../lib/capitalize.js';
import separate from '../lib/separate.js';
import CommitMessage, { type CommitPart, type CommitJSON } from '../CommitMessage/index.js';
import loadConfig from '../config/index.js';
import { zip } from '../lib/zip.js';

class ValidationErrors {
  errs: { [idx: number]: string[] } = {};

  constructor(public prefix?: string) {}

  update(errors: Record<number, string>) {
    for (const idx in errors) {
      if (!this.errs[idx]) this.errs[idx] = [];
      // biome-ignore lint/style/noNonNullAssertion: we're literally looping through it's own keys, it exists.
      this.errs[idx].push(this.prefix ? `[${this.prefix}:${idx}] ${errors[idx]!}` : errors[idx]!);
    }
  }

  list() {
    return Object.values(this.errs).flat();
  }
}

export type RulesConfig = CommitlintConfig['rules'];

export type RuleScope = CommitPart | 'trailer' | 'footer';

export type RuleTypeWithoutValue = 'leading-blank' | 'empty' | 'trim' | 'exclamation-mark';

export type RuleTypeWithValue =
  | 'full-stop'
  | 'max-length'
  | 'min-length'
  | 'max-line-length'
  | 'case'
  | 'enum'
  | 'allow-multiple'
  | 'exists';

export type RuleType = RuleTypeWithValue | RuleTypeWithoutValue;
export type RuleString = `${RuleScope}-${RuleType}`;
export type RuleTypeString<Type extends RuleType = RuleType> = `${string}-${Type}`;

type ValidateReturnType<T> = T extends CommitMessage
  ? [errors: string[], warnings: string[]]
  : T extends string[]
    ? [fixes: string[], errors: string[], warnings: string[]]
    : [fix: string, error: string[], warning: string[]];

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
  exists: ExistsRule;
};

// Extract rule types from config keys
type ExtractRuleTypes<T> = {
  [K in keyof T]: K extends `${string}-${infer Type}` ? Type : never;
}[keyof T];

// Map from rule strings to rule instances
export type Rules<T extends RulesConfig = RulesConfig> = {
  [K in keyof T as K extends `${infer Part}-${infer Type}`
    ? Part extends RuleScope
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
export default class RulesEngine<const Config extends Rules = Rules> {
  private readonly scopes: Record<RuleScope, BaseRule[]>;

  constructor(private readonly rules: Config) {
    // collect rules by scopes
    this.scopes = this.listRules().reduce(
      (scopes, rule) => {
        const { scope } = rule;
        if (!scopes[scope]) scopes[scope] = [];
        scopes[scope].push(rule);
        return scopes;
      },
      {} as Record<RuleScope, BaseRule[]>,
    );
  }

  private listRules(): BaseRule[] {
    return Object.values(this.rules);
  }

  /**
   * Extracts the relevant strings related/associated with the Rule's scope.
   */
  private getRelevantCommitParts(commit: CommitMessage, scope: RuleScope): string[] {
    switch (scope) {
      case 'scope':
        return commit.scopes;
      case 'subject':
        return [commit.subject];
      case 'type':
        return [commit.type];
      case 'body':
        return [commit.body];
      case 'footer':
        return commit.footers.map(v => v.replace(/^[^:]+: /, ''));
      case 'trailer':
        return commit.trailers; // footer tokens only
      case 'footers':
        return commit.footers;
      case 'namespace':
        return [commit.namespace];
    }
  }

  /**
   * Sets relevant commit parts using an array of strings.
   */
  private setRelevantCommitParts(commit: CommitMessage, scope: RuleScope, parts: string[]): void {
    switch (scope) {
      case 'scope':
        commit.scopes = parts.filter(Boolean);
        break;
      case 'subject':
        commit.subject = parts[0] ?? '';
        break;
      case 'type':
        commit.type = parts[0] ?? '';
        break;
      case 'body':
        commit.body = parts[0] ?? '';
        break;
      case 'footer': {
        // zip with footer values back with their tokens and edit.
        zip(commit.trailers, parts, { defaultA: '', defaultB: null }).forEach(([token, message]) =>
          commit.footer(token, message),
        );
        break;
      }
      case 'trailer': {
        const newFooters = zip(commit.trailers, parts, { defaultA: null }).reduce(
          (footers, [existing, incoming]) => {
            // There's a new footer at this index that didn't exist before, mark it to add.
            if (existing === null && incoming !== null) footers.push({ token: incoming, text: '' });
            else if (existing !== null) {
              // Remove the old footer.
              const deletedFooter = commit.footer(existing, null);

              // if not removing any footers, re-add them back in (preserves the order)
              if (deletedFooter && incoming !== null) footers.push({ token: incoming, text: deletedFooter.text });
            }

            // We need to keep order
            return footers;
          },
          [] as { token: string; text: string }[],
        );

        // Now that all footers have been removed, re-add the ones we intend on keeping
        newFooters.forEach(({ token, text }) => commit.footer(token, text));
        break;
      }
      case 'footers':
        commit.footers = parts;
        break;
    }
  }

  /**
   * Parse string array against current rules with optional fixing
   */
  private validateParts(
    inputs: string[],
    behaviour: 'validate' | 'fix',
  ): [outputs: string[], errors: string[], warnings: string[]] {
    const shouldFix = behaviour === 'fix';

    const errors = new ValidationErrors();
    const warnings = new ValidationErrors();

    for (const rule of this.listRules()) {
      errors.prefix = rule.scope;
      warnings.prefix = rule.scope;

      const [res, errs, warns] = rule.check(inputs, shouldFix);
      inputs = res;
      if (errs) errors.update(errs);
      if (warns) warnings.update(warns);
    }

    return [inputs, errors.list(), warnings.list()];
  }

  /**
   * Parse input through rules and attempt to fix violations.
   * @param input - CommitMessage or string array to parse
   * @param behaviour - 'validate' or 'fix'
   * @returns [errors, warnings] - Arrays of error and warning messages
   */
  validate<T extends CommitMessage | string[] | string>(
    input: T,
    behaviour: 'validate' | 'fix' = 'fix',
  ): ValidateReturnType<T> {
    if (typeof input === 'string') {
      const [[output], errors, warnings] = this.validateParts([input], behaviour);
      return [output, errors, warnings] as ValidateReturnType<T>;
    }
    if (Array.isArray(input)) return this.validateParts(input, behaviour) as ValidateReturnType<T>;

    const scopedErrors: string[] = [];
    const scopedWarnings: string[] = [];
    const shouldFix = behaviour === 'fix';

    for (const scope in this.scopes) {
      let results = this.getRelevantCommitParts(input, scope as RuleScope);
      const errors = new ValidationErrors(scope);
      const warnings = new ValidationErrors(scope);

      const scopedRules = this.scopes[scope as RuleScope];
      for (const rule of scopedRules) {
        const [res, errs, warns] = rule.check(results, shouldFix);
        results = res;
        if (errs) errors.update(errs);
        if (warns) warnings.update(warns);
      }

      // If fixing is enabled, apply fixes back to commit
      if (shouldFix) this.setRelevantCommitParts(input, scope as RuleScope, results);

      scopedErrors.push(...errors.list());
      scopedWarnings.push(...warnings.list());
    }

    return [scopedErrors, scopedWarnings] as ValidateReturnType<T>;
  }

  /**
   * Access all rules of specified types.
   * Returns all rules that match any of the provided rule types.
   * @param ruleTypes - One or more rule types to match
   * @returns Array of matching rules
   */
  getRulesOfType<Type extends ExtractRuleTypes<Config> & RuleType>(...ruleTypes: Type[]): RuleMapping[Type][] {
    const rules: RuleMapping[Type][] = [];

    for (const ruleName in this.rules) {
      const rule = this.rules[ruleName];
      if (rule && ruleTypes.some(type => ruleName.endsWith(`-${type}`))) {
        rules.push(rule as RuleMapping[Type]);
      }
    }

    return rules;
  }

  /**
   * Narrows the scope of the current rules to the selected scope(s)
   * Creates a new RulesEngine instance containing only rules that apply to the specified scope(s).
   * This allows for targeted validation of specific scopes.
   *
   * @param scope - The scope to filter rules by for (e.g. 'type', 'subject', 'scope', etc)
   * @returns A new RulesEngine instance containing only rules that apply to the specified scope(s)
   */
  narrow(...scopes: RuleScope[]): RulesEngine<Rules> {
    const narrowedRules: Record<string, BaseRule> = {};

    for (const ruleName in this.rules) {
      if (scopes.some(part => ruleName.startsWith(part))) {
        narrowedRules[ruleName] = this.rules[ruleName] as BaseRule;
      }
    }

    // Return a new instance of RulesEngine filtered to the part of the commit message we're interested in.
    return new RulesEngine(narrowedRules);
  }

  /**
   * Filters rules to only include the specified types(s)
   * Creates a new RulesEngine instance containing only rules that contain the selected type(s).
   * This allows for specific rules to be tested.
   *
   * @param scope - The type to filter rules by for (e.g. 'enum', 'exists', 'empty', etc...)
   * @returns A new RulesEngine instance containing only rules for the specified type(s)
   */
  extract(...types: RuleType[]): RulesEngine<Rules> {
    const filteredRules: Record<string, BaseRule> = {};

    for (const ruleName in this.rules) {
      if (types.some(part => ruleName.endsWith(`-${part}`))) {
        filteredRules[ruleName] = this.rules[ruleName] as BaseRule;
      }
    }

    // Return a new instance of RulesEngine filtered to the part of the commit message we're interested in.
    return new RulesEngine(filteredRules);
  }

  /**
   * Filters the current rules to NOT contain the specified type(s)
   * Creates a new RulesEngine instance omitting any types specified.
   * This allows for specific rules to be tested.
   *
   * @param scope - The type(s) of rules to omit (e.g. 'enum', 'exists', 'empty', etc...)
   * @returns A new RulesEngine instance without the omitted rules.
   */
  omit(...types: RuleType[]): RulesEngine<Rules> {
    const filteredRules: Record<string, BaseRule> = {};

    for (const ruleName in this.rules) {
      if (types.some(part => !ruleName.endsWith(`-${part}`))) {
        filteredRules[ruleName] = this.rules[ruleName] as BaseRule;
      }
    }

    // Return a new instance of RulesEngine filtered to the part of the commit message we're interested in.
    return new RulesEngine(filteredRules);
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
    // Assume everything is optional unless otherwise required or forbidden
    const optional = new Set<CommitPart>(['type', 'subject', 'scope', 'body', 'footers']);

    /*
      'Exists' and 'Empty' rules govern the required/optional/forbidden behaviour
      ? treat 'trailer' and 'footer' separately as they reference subtypes within footer structure.
    */
    const emptyRules = this.listRules().filter(
      rule => rule instanceof EmptyRule && !['trailer', 'footer'].includes(rule.scope),
    );

    const ruleToString = (rule: BaseRule) => {
      const name = rule.scope as CommitPart; // We have filtered out 'trailer' and 'footer' rules above
      optional.delete(name);
      return name;
    };

    // Separate out required and forbidden empty rules, removing from the 'optional' set
    // what's left over are optional properties and the rest are either required or forbidden from the configured rules.
    const [required, forbidden] = separate(new Set(emptyRules), rule => rule.applicable === 'never', {
      onPass: ruleToString,
      onFail: ruleToString,
    });

    /*
      'trailer-exists' rule is a special case (ugh) that handles a specific footer token existing/not-existing
      Example:
        'Signed-off-by: <name>'
      <name> can be anything
      This rules isn't goverened by 'footers' rules, as those apply to general structure of footers (not the values inside them)
      And 'footer' rules apply the value after the token.

      We check to see if 'trailer-exists' has been applied, and if so this means that footers must not be empty.
    */
    const [trailerExists] = this.narrow('trailer').getRulesOfType('exists');
    if (trailerExists) required.add('footers');

    return { required: [...required], optional: [...optional], forbidden: [...forbidden] };
  }

  /**
   * Returns a human readable string that describes all rules that this engine enforces.
   * @returns
   */
  describe(): string {
    const description: string[] = [];

    description.push('## Commit message standard');
    description.push(this.commitStructure());

    description.push('\n## General Rules');
    description.push(this.generalRules());

    return description.join('\n');
  }

  commitStructure(): string {
    const description: string[] = [];
    const requiredList = new Intl.ListFormat('en-au', { type: 'conjunction', style: 'long', localeMatcher: 'best fit' });
    const optionalList = new Intl.ListFormat('en-au', { type: 'disjunction', style: 'long', localeMatcher: 'best fit' });

    const { required, optional, forbidden } = this.allowedCommitProps();

    const commitStructure: CommitJSON = {};
    const structure = [];
    // Required
    if (required.length) {
      required.forEach(rule => {
        if (rule === 'footers') {
          const footerStructure: string[] = [];

          /*
            The only reason footers would be required... if there was a trailer rule
            Or... rarely the user has configured footers-empty 'never' which without enforcing a specific type of a footer, is nonsensicle (but legal).
            In this case, the trailers must be specified, followed by optional footers.
          */
          const [trailerExists] = this.narrow('trailer').getRulesOfType('exists');

          if (trailerExists) footerStructure.push(...trailerExists.value.map(trailer => `<${trailer}>: <footer>`));
          else footerStructure.push('<token>: <footer>');

          commitStructure[rule] = footerStructure;
        } else {
          commitStructure[rule] = `<${rule}>`;
        }
      });
      structure.push(`must have a ${requiredList.format(required)}`);
    }
    // Optional
    if (optional.length) {
      optional.forEach(rule => {
        if (rule === 'footers') {
          const footerStructure = commitStructure.footers ?? [];
          footerStructure.push('[optional: footer(s)]');
          commitStructure[rule] = footerStructure;
        } else {
          commitStructure[rule] = `[optional ${rule}]`;
        }
      });
      structure.push(`may have a ${optionalList.format(optional)}`);
    }
    // Forbidden
    if (forbidden.length) structure.push(`must not contain a ${optionalList.format(forbidden)}`);
    if (structure[0]) structure[0] = `Commit messages ${structure[0]}`;

    // Show what's required
    description.push(requiredList.format(structure));

    // Show what the stucture looks like.
    description.push('```txt');
    description.push(CommitMessage.fromJSON(commitStructure).toString());
    description.push('```');

    return description.join('\n');
  }

  generalRules(): string {
    const ruleDescriptions: string[] = [];

    const rules = this.listRules();

    // Separate out Empty rules
    const nonEmptyRules = rules.filter(rule => !(rule instanceof EmptyRule));

    (['type', 'scope', 'subject', 'header', 'body', 'footers', 'footer', 'trailer'] as RuleScope[]).reduce(
      (rules, part) => {
        // find all rules for the type.
        const [applicableRules, otherRules] = separate(rules, rule => rule.scope.startsWith(part));

        if (applicableRules.length) ruleDescriptions.push(`### ${capitalize(part)}`);
        applicableRules.forEach(rule => ruleDescriptions.push(`- ${rule.describe()}`));

        // There's no "rule" for this, so it's a begrudging special case
        if (part === 'subject')
          ruleDescriptions.push('- The subject must be written in imperative mood (Fix, not Fixed / Fixes etc.)');

        // return the other rules to continue
        return otherRules;
      },
      nonEmptyRules,
    );

    return ruleDescriptions.join('\n');
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
        const [name, type] = ruleName.split(/(?<=^\w+)-/) as [RuleScope, RuleType];

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
    ruleName: RuleScope,
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
      case 'exists': {
        const values = !Array.isArray(value) ? [value] : value;
        if (values.some(v => typeof v !== 'string')) break;
        return new ExistsRule(ruleName, level, condition, values) as RuleMapping[T];
      }
      case 'enum':
        if (!Array.isArray(value)) break;
        return new EnumRule(ruleName, level, condition, value) as RuleMapping[T];
      case 'full-stop':
        if (!value) value === '.';
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
        if (!value) value === ',';
        if (typeof value !== 'string') break;
        return new AllowMultipleRule(ruleName, level, condition, value) as RuleMapping[T];
    }
    return;
  }
}
