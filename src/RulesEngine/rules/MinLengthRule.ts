import { BaseRuleWithValue } from './BaseRule.js';

export class MinLengthRule extends BaseRuleWithValue<number> {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(parts.map((part, idx) => [idx, !this.validateMinLength(part) && this.minLengthErrorMessage()]).filter(([, err]) => err));
    return Object.keys(errs).length ? errs : null;
  }

  private validateMinLength(input: string): boolean {
    const isGreaterThanMinLength = input.length >= this.value;
    return this.applicable === 'always' ? isGreaterThanMinLength : !isGreaterThanMinLength;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    // Can't automatically fix minimum length issues - return original with errors
    const errs = this.validate(parts);
    return [errs, parts];
  }

  private minLengthErrorMessage(): string {
    return `the ${this.scope} must be at least ${this.value} characters`;
  }
}
