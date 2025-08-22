import { RuleConfigSeverity, type RuleConfigCondition, type RuleConfigTuple } from '@commitlint/types';
import type { RuleScope } from '../index.js';
export { RuleConfigSeverity };
export type { RuleConfigCondition, RuleConfigTuple };

export abstract class BaseRule {
  constructor(
    public readonly scope: RuleScope,
    protected readonly level: RuleConfigSeverity,
    public readonly applicable: RuleConfigCondition = 'always',
  ) {}

  /**
   * Get a description of the rule
   * @returns Description of the rule
   */
  abstract describe(): string;

  /**
   * Check if the input parts pass the rule
   * @param parts Array of strings to validate
   * @returns Array where null = valid, string = error message
   */
  abstract validate(parts: string[]): null | Record<number, string>;

  /**
   * Fix the input parts based on the rule
   * @param parts Array of strings to fix
   * @returns Array of fixed strings (same length as input)
   */
  abstract fix(parts: string[]): [errors: null | Record<number, string>, fixed: string[]];

  /**
   * Check if the input parts pass the rule by first validating and optionally fixing
   * @param parts Array of strings to check
   * @param fix Whether to attempt fixing invalid parts
   * @returns Array of results: null if valid, string if warning, Error if error
   */
  check(
    input: string[],
    fix = true,
  ): [output: string[], err: null | Record<number, string>, warnings: null | Record<number, string>] {
    // TODO: Disabled should never occur, this should be parsed at config time and simply not ingested.
    // Disabled, return early
    if (this.level === RuleConfigSeverity.Disabled) return [input, null, null];

    // fix or validate
    const [err, fixed] = fix ? this.fix(input) : [this.validate(input)];
    const output = fixed ?? input;

    // No errors return output as fixed or original input, the caller will know if they have chosen to fix or not
    if (!err) return [output, null, null];

    // Otherwise we encountered some errors.
    if (this.level === RuleConfigSeverity.Warning) return [output, null, err];
    return [output, err, null];
  }

  protected errorOrNull<const T extends Record<number, string>>(errors: T): null | T {
    return Object.keys(errors).length ? errors : null;
  }
}

export abstract class BaseRuleWithValue<T = unknown> extends BaseRule {
  constructor(
    scope: RuleScope,
    level: RuleConfigSeverity,
    applicable: RuleConfigCondition,
    public readonly value: T,
  ) {
    super(scope, level, applicable);
  }
}
