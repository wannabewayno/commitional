import { BaseRule } from './BaseRule.js';

export class TrimRule extends BaseRule {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(parts.map((part, idx) => [idx, !this.validateTrim(part) && this.trimErrorMessage()]).filter(([, err]) => err));
    return Object.keys(errs).length ? errs : null;
  }

  private validateTrim(input: string): boolean {
    const isTrimmed = input === input.trim();
    return this.applicable === 'always' ? isTrimmed : !isTrimmed;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    const fixed = parts.map(part => part.trim());
    const errs = this.validate(fixed);
    return [errs, fixed];
  }

  private trimErrorMessage(): string {
    const modifier = this.applicable === 'always' ? 'must' : 'must not';
    return `the ${this.scope} ${modifier} have leading or trailing whitespace`;
  }
}
