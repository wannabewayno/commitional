import { BaseRuleWithValue } from './BaseRule.js';

export class MaxLengthRule extends BaseRuleWithValue<number> {
  validate(input: string): boolean {
    const isLessThanMaxLength = input.length <= this.value;
    return this.applicable === 'always' ? isLessThanMaxLength : !isLessThanMaxLength;
  }

  fix(input: string): string | null {
    if (this.applicable === 'never' && input.length < this.value) return null;
    return input.substring(0, this.value);
  }

  errorMessage(): string {
    return `exceed ${this.value} characters`;
  }
}
