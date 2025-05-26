import { RuleConfigSeverity, RuleConfigCondition, RuleConfigTuple } from '@commitlint/types';
export  { RuleConfigSeverity };
export type { RuleConfigCondition, RuleConfigTuple };

export abstract class BaseRule {
  protected readonly applicable: RuleConfigCondition = 'always';
  protected readonly level: RuleConfigSeverity;

  constructor(level: RuleConfigSeverity, applicable: RuleConfigCondition) {
    if (applicable) this.applicable = applicable;
    this.level = level;
  }

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
   * Check if the input passes the rule and handle the result based on rule level
   * @param input The input to check against the rule
   * @returns the original or fixed string if applicable. return an error if an ERROR.
   */
  check(input: string): string | Error {
    if (this.level === RuleConfigSeverity.Disabled) return input;

    const result = this.validate(input);

    // Invert rule if 'never'
    const finalResult = this.applicable === 'never' ? !result : result;

    if (finalResult) return input;

    // Attempt to fix the input if invalid.
    const fixedInput = this.fix(input);

    if (fixedInput !== null) return fixedInput;

    const errorMsg = new Error(this.errorMessage());

    // We couldn't fix it. If it's a Warning, return an error
    if (this.level === RuleConfigSeverity.Warning) return errorMsg;

    // Not a warning, throw the error.
    throw errorMsg;
  }
}

export abstract class BaseRuleWithValue<T = unknown> extends BaseRule {
  constructor(level: RuleConfigSeverity, applicable: RuleConfigCondition, protected readonly value: T) {
    super(level, applicable);
  }
}