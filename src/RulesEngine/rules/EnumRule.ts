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
    const value = [...this.value];
    const last = value.pop();
    const message = ['the', this.name];

    if (this.applicable === 'never') message.push("can't be any of:");
    else message.push('can only be one of:');

    message.push(value.map(v => `'${v}'`).join(', '));
    if (last) message.push(`or '${last}'`);

    return message.join(' ');
  }
}
