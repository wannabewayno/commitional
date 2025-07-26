import { RuleConfigSeverity, type RuleConfigCondition, type RuleConfigTuple } from '@commitlint/types';
import type { CommitPart } from '../index.js';
export { RuleConfigSeverity };
export type { RuleConfigCondition, RuleConfigTuple };

export abstract class BaseRule {
  constructor(
    public readonly name: CommitPart,
    protected readonly level: RuleConfigSeverity,
    public readonly applicable: RuleConfigCondition = 'always',
  ) {}

  /**
   * Check if the input passes the rule
   * @param input The input to check against the rule
   * @returns true if VALID or OFF, string message if WARNING, error if ERROR
   */
  abstract validate(input: string): boolean;

  /**
   * Fix the input based on the rule
   * @param {string} input - The input to fix
   * @returns {string | null} - The fixed input if able to fix, otherwise null if unable to fix
   */
  abstract fix(input: string): string | null;

  /**
   * Since rules work as 'always' or 'never' error messages should be able to handle both
   * Good rule of thumb is this 'Must <always|never> <error message>'
   * @returns {String} - Message for why this was rejected.
   */
  abstract errorMessage(): string;

  /**
   * Check if the input passes the rule by first validating it and if it fails, attempt to fix it
   * If it can be fixed, return the augmented string, otherwise return or throw an error as appropriate to the level.
   * @param input The input to check against the rule
   * @returns original string or fixed string if valid, error if WARNING and cannot be fixed.
   * @throws error if level is ERROR and cannont be fixed.
   */
  check(input: string, fix = true): string | Error {
    if (this.level === RuleConfigSeverity.Disabled) return input;

    const result = this.validate(input);

    if (result) return input;

    if (fix) {
      // Attempt to fix the input if invalid.
      const fixedInput = this.fix(input);

      if (fixedInput !== null) return fixedInput;
    }

    const errorMsg = new Error(this.errorMessage());

    // We couldn't fix it. If it's a Warning, return an error
    if (this.level === RuleConfigSeverity.Warning) return errorMsg;

    // Not a warning, throw the error.
    throw errorMsg;
  }
}

export abstract class BaseRuleWithValue<T = unknown> extends BaseRule {
  constructor(
    name: CommitPart,
    level: RuleConfigSeverity,
    applicable: RuleConfigCondition,
    public readonly value: T,
  ) {
    super(name, level, applicable);
  }
}
