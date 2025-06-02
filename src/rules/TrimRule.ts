import { BaseRule } from './BaseRule.js';

export class TrimRule extends BaseRule {
  get value() {
    return null;
  }

  validate(input: string): boolean {
    const isTrimmed = input === input.trim();
    return this.applicable === 'always' ? isTrimmed : !isTrimmed;
  }

  fix(input: string): string | null {
    return input.trim();
  }

  errorMessage(): string {
    return 'not have leading or trailing whitespace';
  }
}
