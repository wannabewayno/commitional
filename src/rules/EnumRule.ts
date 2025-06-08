import { BaseRuleWithValue } from './BaseRule.js';

export class EnumRule extends BaseRuleWithValue<string[]> {
  validate(input: string): boolean {
    // Can't validate empty input, asssume it's valid
    // If input is required it will be picked up by allow-empty rules.
    if (!input) return true;
    return this.value.includes(input);
  }

  fix(_input: string): string | null {
    // Can't automatically fix enum issues
    // Could potentially use string similarity to find closest match,
    // but that's beyond the scope of a simple fix
    return null;
  }

  errorMessage(): string {
    return `be one of: ${this.value.join(', ')}`;
  }
}
