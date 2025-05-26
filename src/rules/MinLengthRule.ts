import { BaseRuleWithValue } from './BaseRule.js';

export class MinLengthRule extends BaseRuleWithValue<number> {
  validate(input: string): boolean {
    return input.length >= this.value;
  }

  fix(_input: string): string | null {
    // Can't automatically fix minimum length issues
    return null;
  }

  errorMessage(): string {
    return `be at least ${this.value} characters`;
  }
}
