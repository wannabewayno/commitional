import { BaseRule } from './BaseRule.js';

export class LeadingBlankRule extends BaseRule {
  get value() {
    return null;
  }

  validate(input: string): boolean {
    const lines = input.split('\n');
    const hasLeadingBlank = lines.length > 0 && lines[0]?.trim() === '';
    return this.applicable === 'always' ? hasLeadingBlank : !hasLeadingBlank;
  }

  fix(input: string): string | null {
    if (this.applicable === 'always' && !this.validate(input)) {
      return `\n${input}`;
    }

    if (this.applicable === 'never' && !this.validate(input)) {
      const lines = input.split('\n');
      return lines.slice(1).join('\n');
    }

    return null;
  }

  errorMessage(): string {
    return `must ${this.applicable} begin with a blank line`;
  }
}
