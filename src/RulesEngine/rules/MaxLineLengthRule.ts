import wrapText from '../../lib/wrapText.js';
import { BaseRuleWithValue } from './BaseRule.js';

export class MaxLineLengthRule extends BaseRuleWithValue<number> {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(
      parts.map((part, idx) => [idx, !this.validateMaxLineLength(part) && this.describe()]).filter(([, err]) => err),
    );
    return Object.keys(errs).length ? errs : null;
  }

  private validateMaxLineLength(input: string): boolean {
    const lines = input.split('\n');
    return !lines.some(line => line.length > this.value);
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    const fixed = parts.map(part => wrapText(part, this.value));
    return [null, fixed];
  }

  describe(): string {
    return `The ${this.scope} must be wrapped at ${this.value} characters`;
  }
}
