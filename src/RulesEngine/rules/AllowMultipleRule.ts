import { BaseRuleWithValue } from './BaseRule.js';

export class AllowMultipleRule extends BaseRuleWithValue<string> {
  validate(inputs: string[]): null | Record<number, string> {
    if (this.applicable === 'always') return null
    
    const [, ...rest] = inputs;
    if (rest.length) return Object.fromEntries(rest.map((_, i) => [i + 1, this.allowMultipleErrorMessage()]));
    return null;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    if (this.applicable === 'always') return [null, parts];

    // Keep only the first part
    return [null, parts.slice(0, 1)];
  }

  private allowMultipleErrorMessage(): string {
    return `Multiple ${this.scope}s aren't allowed`;
  }
}
