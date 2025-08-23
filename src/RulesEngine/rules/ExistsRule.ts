import { BaseRuleWithValue, type RuleConfigCondition, type RuleConfigSeverity } from './BaseRule.js';
import type { RuleScope } from '../index.js';

export class ExistsRule extends BaseRuleWithValue<string[]> {
  constructor(name: RuleScope, level: RuleConfigSeverity, applicable: RuleConfigCondition, value: string | string[]) {
    value = !Array.isArray(value) ? [value] : value;
    super(name, level, applicable, value);
  }

  validate(parts: string[]): null | Record<number, string> {
    if (this.applicable === 'always') {
      const missingValues = this.value.filter(v => !parts.includes(v.trim()));
      if (missingValues.length > 0) {
        return { 0: this.describe() };
      }
    } else {
      const errs = Object.fromEntries(
        parts
          .map((part, idx) => [idx, this.value.includes(part.trim()) && `Forbidden value: '${part}' - ${this.describe()}`])
          .filter(([, err]) => err),
      );
      if (Object.keys(errs).length > 0) return errs;
    }

    return null;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    if (this.applicable === 'always') {
      // Add missing required values
      const missingValues = this.value.filter(v => !parts.includes(v));
      const fixed = [...parts, ...missingValues];
      return [null, fixed];
    }
    // Remove forbidden values
    const fixed = parts.filter(part => !this.value.includes(part.trim()));
    return [null, fixed];
  }

  describe(): string {
    const message = [
      'The',
      `${this.scope}${this.value.length > 1 ? 's' : ''}`,
      this.value.map(v => `'${v}'`).join(', '),
      'must',
      this.applicable,
      'exist',
    ];

    return message.join(' ');
  }
}
