import { BaseRule } from './BaseRule.js';

export class EmptyRule extends BaseRule {
  validate(input: string): boolean {
    return input.trim() === '';
  }

  fix(input: string): string | null {
    // If applicable is 'always', we can fix by returning empty string
    if (this.applicable === 'always') {
      return '';
    }
    // Can't fix if applicable is 'never' and input is empty
    return null;
  }

  errorMessage(): string {
    return 'be empty';
  }
}
