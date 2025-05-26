import { BaseRuleWithValue } from './BaseRule.js';

export class FullStopRule extends BaseRuleWithValue<string> {
  validate(input: string): boolean {
    return input.endsWith(this.value);
  }

  fix(input: string): string | null {
    if (this.applicable === 'always' && !input.endsWith(this.value)) {
      return input + this.value;
    }

    if (this.applicable === 'never' && input.endsWith(this.value)) {
      return input.slice(0, -this.value.length);
    }

    return null;
  }

  errorMessage(): string {
    return `end with "${this.value}"`;
  }
}
