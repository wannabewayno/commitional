import { BaseRule } from './BaseRule.js';

export class EmptyRule extends BaseRule {
  validate(input: string): boolean {
    const isEmpty = input.trim() === '';
    return this.applicable === 'always' ? isEmpty : !isEmpty;
  }

  fix(_input: string): string | null {
    // If applicable is 'always', we can fix by returning empty string
    if (this.applicable === 'always') return '';

    // Can't fix if applicable is 'never' and input is empty
    return null;
  }

  errorMessage(): string {
    return `the ${this.name} must ${this.applicable} be empty`;
  }
}
