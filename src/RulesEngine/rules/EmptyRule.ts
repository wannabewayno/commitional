import { BaseRule } from './BaseRule.js';

export class EmptyRule extends BaseRule {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(parts.map((part, idx) => [idx, !this.validateEmpty(part) && this.emptyErrorMessage()]).filter(([, err]) => err));
    return Object.keys(errs).length ? errs : null;
  }

  private validateEmpty(input: string): boolean {
    const isEmpty = input.trim() === '';
    return this.applicable === 'always' ? isEmpty : !isEmpty;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    // If applicable is 'always', we can fix by setting empty strings
    if (this.applicable === 'always') return [null, parts.map(() => '')];

    // Can't fix if applicable is 'never' and input is empty - return original
    const errs = Object.fromEntries(parts.map((part, idx) => [idx, !this.validateEmpty(part) && this.emptyErrorMessage()]).filter(([, err]) => err));
    return [Object.keys(errs).length ? errs : null, parts];
  }

  private emptyErrorMessage(): string {
    return `the ${this.scope} must ${this.applicable} be empty`;
  }
}
