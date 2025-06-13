import { BaseRule } from './BaseRule.js';

export class TrimRule extends BaseRule {
  validate(input: string): boolean {
    const isTrimmed = input === input.trim();
    return this.applicable === 'always' ? isTrimmed : !isTrimmed;
  }

  fix(input: string): string | null {
    return input.trim();
  }

  errorMessage(): string {
    const modifier = this.applicable === 'always' ? 'must' : 'must not';
    return `the ${this.name} ${modifier} have leading or trailing whitespace`;
  }
}
