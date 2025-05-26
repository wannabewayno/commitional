export enum RuleLevel {
  OFF = 0,
  WARNING = 1,
  ERROR = 2,
}

export type RuleApplicable = 'always' | 'never';

export type RuleArgs<T> = [level: RuleLevel, applicable: RuleApplicable, value: T];

export abstract class BaseRule<T = unknown> {
  protected value: T;
  protected applicable: RuleApplicable;
  protected level: RuleLevel;

  constructor([level, applicable, value]: RuleArgs<T>) {
    // [value: T, applicable: RuleApplicable = 'always', level: RuleLevel = RuleLevel.ERROR]
    this.value = value;
    this.applicable = applicable;
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
    if (this.level === RuleLevel.OFF) return input;

    const result = this.validate(input);

    // Invert rule if 'never'
    const finalResult = this.applicable === 'never' ? !result : result;

    if (finalResult) return input;

    // Attempt to fix the input if invalid.
    const fixedInput = this.fix(input);

    if (fixedInput) return fixedInput;

    const errorMsg = new Error(this.errorMessage());

    // We couldn't fix it. If it's a Warning, return an error
    if (this.level === RuleLevel.WARNING) return errorMsg;

    // Not a warning, throw the error.
    throw errorMsg;
  }
}
