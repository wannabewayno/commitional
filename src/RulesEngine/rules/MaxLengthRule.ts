import { BaseRuleWithValue } from './BaseRule.js';

export class MaxLengthRule extends BaseRuleWithValue<number> {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(
      parts.map((part, idx) => [idx, !this.validateMaxLength(part) && this.describe()]).filter(([, err]) => err),
    );
    return Object.keys(errs).length ? errs : null;
  }

  private validateMaxLength(input: string): boolean {
    const isLessThanMaxLength = input.length <= this.value;
    return this.applicable === 'always' ? isLessThanMaxLength : !isLessThanMaxLength;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    if (this.applicable === 'never') {
      const errs = this.validate(parts);
      return [errs, parts];
    }

    const fixed = parts.map(part => part.substring(0, this.value));
    return [null, fixed];
  }

  describe(): string {
    return `The ${this.scope} must not exceed ${this.value} characters`;
  }
}
