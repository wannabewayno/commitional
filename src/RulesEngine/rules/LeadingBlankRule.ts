import { BaseRule } from './BaseRule.js';

export class LeadingBlankRule extends BaseRule {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(
      parts.map((part, idx) => [idx, !this.validateLeadingBlank(part) && this.describe()]).filter(([, err]) => err),
    );
    return Object.keys(errs).length ? errs : null;
  }

  private validateLeadingBlank(input: string): boolean {
    const hasLeadingBlank = /^[\s]*\n/.test(input);
    return this.applicable === 'always' ? hasLeadingBlank : !hasLeadingBlank;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    const fixed = parts.map(part => {
      return this.applicable === 'never' ? part.trimStart() : part.replace(/^[^\n]/, v => `\n${v}`);
    });

    return [null, fixed];
  }

  describe(): string {
    return `The ${this.scope} must ${this.applicable} begin with a blank line`;
  }
}
