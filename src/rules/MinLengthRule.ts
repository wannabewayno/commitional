import { BaseRuleWithValue } from './BaseRule.js';

export class MinLengthRule extends BaseRuleWithValue<number> {
  validate(input: string): boolean {
    const isGreaterThanMinLength = input.length >= this.value;
    return this.applicable === 'always' ? isGreaterThanMinLength : !isGreaterThanMinLength;
  }

  fix(_input: string): string | null {
    // Can't automatically fix minimum length issues
    return null;
  }

  errorMessage(): string {
    return `the subject must be at least ${this.value} characters`;
  }
}
