import { BaseRule } from './BaseRule.js';

export class MaxLengthRule extends BaseRule<number> {
  validate(input: string): boolean {
    return input.length <= this.value;
  }

  fix(input: string): string | null {
    if (this.applicable === 'never' && input.length < this.value) return null;
    return input.substring(0, this.value);
  }

  errorMessage(): string {
    return `exceed ${this.value} characters`;
  }
}
