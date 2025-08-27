import { BaseRuleWithValue } from './BaseRule.js';
import type { GitContext } from '../GitContext.js';

export class EnumRule extends BaseRuleWithValue<string[]> {
  validate(parts: string[], _context?: GitContext): null | Record<number, string> {
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

  fix(parts: string[], context?: GitContext): [null | Record<number, string>, string[]] {
    // Can't automatically fix enum issues - return original with errors
    // Could potentially use string similarity to find closest match,
    // but that's beyond the scope of a simple fix
    const errs = this.validate(parts, context);
    return [errs, parts];
  }

  describe(): string {
    const value = [...this.value];
    if (value.length === 0) return `The ${this.scope} must ${this.applicable} be empty`;
    if (value.length === 1) return `The ${this.scope} must ${this.applicable} be '${value[0]}'`;

    const last = value.pop();
    const message = ['The', this.scope];

    if (this.applicable === 'never') message.push("can't be any of:");
    else message.push('can only be one of:');

    message.push(value.map(v => `'${v}'`).join(', '));
    if (last) message.push(`or '${last}'`);

    return message.join(' ');
  }
}
