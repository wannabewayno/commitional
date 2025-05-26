import { BaseRule } from './BaseRule.js';

export class MinLengthRule extends BaseRule<number> {
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
