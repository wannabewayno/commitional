import { BaseRuleWithValue } from './BaseRule.js';

export class EnumRule extends BaseRuleWithValue<string[]> {
  validate(parts: string[]): null | Record<number, string> {
    const errs = parts.reduce(
      (errors, part, idx) => {
        // Can't validate empty input, assume it's valid
        if (!part) return errors;

        const isValid = this.value.includes(part);
        const valid = this.applicable === 'always' ? isValid : !isValid;

        if (!valid) errors[idx] = this.describe();

        return errors;
      },
      {} as Record<number, string>,
    );

    return this.errorOrNull(errs);
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    // Can't automatically fix enum issues - return original with errors
    // Could potentially use string similarity to find closest match,
    // but that's beyond the scope of a simple fix
    const errs = this.validate(parts);
    return [errs, parts];
  }

  describe(): string {
    const value = [...this.value];
    const last = value.pop();
    const message = ['The', this.scope];

    if (this.applicable === 'never') message.push("can't be any of:");
    else message.push('can only be one of:');

    message.push(value.map(v => `'${v}'`).join(', '));
    if (last) message.push(`or '${last}'`);

    return message.join(' ');
  }
}
