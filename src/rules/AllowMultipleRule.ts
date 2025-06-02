import { BaseRuleWithValue } from './BaseRule.js';

export class AllowMultipleRule extends BaseRuleWithValue<string> {
  validate(input: string): boolean {
    if (!input) return true;

    // The value is the delimiter
    const delimiter = this.value;
    const items = input.split(delimiter).filter(item => item.trim() !== '');

    if (this.applicable === 'always') {
      // For 'always', we're *allowing* multiple items so it's free real estate. return valid.
      return true;
    }

    // For 'never', we should have at most one item
    return items.length <= 1;
  }

  fix(_input: string): string | null {
    // Can't automatically fix multiple items issues
    if (this.applicable === 'always') return _input;

    const [firstItem] = _input.split(this.value);

    return firstItem;
  }

  errorMessage(): string {
    return "Multiple aren't allowed";
  }
}
