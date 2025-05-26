import { BaseRule } from './BaseRule.js';

export class ExclamationMarkRule extends BaseRule {
  validate(input: string): boolean {
    return input.includes('!:');
  }

  fix(input: string): string | null {
    if (this.applicable === 'always' && !input.includes('!:')) {
      // Try to insert exclamation mark before the first colon
      const colonIndex = input.indexOf(':');
      if (colonIndex > 0) return `${input.slice(0, colonIndex)}!${input.slice(colonIndex)}`;
    }

    if (this.applicable === 'never' && input.includes('!:')) return input.replace('!:', ':');

    return null;
  }

  errorMessage(): string {
    return 'have an exclamation mark before the colon';
  }
}
