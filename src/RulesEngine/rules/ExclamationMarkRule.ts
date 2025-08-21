import { BaseRule } from './BaseRule.js';

export class ExclamationMarkRule extends BaseRule {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(
      parts
        .map((part, idx) => [idx, !this.validateExclamationMark(part) && this.exclamationMarkErrorMessage()])
        .filter(([, err]) => err),
    );
    return this.errorOrNull(errs);
  }

  private validateExclamationMark(input: string): boolean {
    const hasExclamationMarkBeforeTheColon = input.includes('!:');
    return this.applicable === 'always' ? hasExclamationMarkBeforeTheColon : !hasExclamationMarkBeforeTheColon;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    const errors: Record<number, string> = {};

    const fixed = parts.map((part, index) => {
      if (!part.includes(':')) {
        errors[index] = this.exclamationMarkErrorMessage();
        return part;
      }
      return this.applicable === 'always'
        ? part.replace(/[^!]:/, v => `${v.slice(0, 1)}!${v.slice(1)}`)
        : part.replace(/!:/, ':');
    });

    return [this.errorOrNull(errors), fixed];
  }

  private exclamationMarkErrorMessage(): string {
    const modifier = this.applicable === 'always' ? 'must' : 'must not';
    return `the ${this.scope} ${modifier} have an exclamation mark before the colon`;
  }
}
