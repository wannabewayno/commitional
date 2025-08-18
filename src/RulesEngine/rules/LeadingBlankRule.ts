import { BaseRule } from './BaseRule.js';

export class LeadingBlankRule extends BaseRule {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(parts.map((part, idx) => [idx, !this.validateLeadingBlank(part) && this.LeadingBlankErrorMessage()]).filter(([, err]) => err));
    return Object.keys(errs).length ? errs : null;
  }

  private validateLeadingBlank(input: string): boolean {
    const lines = input.split('\n');
    const hasLeadingBlank = lines.length > 0 && lines[0]?.trim() === '';
    return this.applicable === 'always' ? hasLeadingBlank : !hasLeadingBlank;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    const fixed = parts.map(part => {
      if (this.applicable === 'always' && !this.validateLeadingBlank(part)) {
        return `\n${part}`;
      }

      if (this.applicable === 'never' && this.validateLeadingBlank(part)) {
        const lines = part.split('\n');
        return lines.slice(1).join('\n');
      }

      return part;
    });
    
    return [null, fixed];
  }

  private LeadingBlankErrorMessage(): string {
    return `the ${this.scope} must ${this.applicable} begin with a blank line`;
  }
}
