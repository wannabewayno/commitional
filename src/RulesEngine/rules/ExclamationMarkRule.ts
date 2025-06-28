import { BaseRule } from './BaseRule.js';

export class ExclamationMarkRule extends BaseRule {
  validate(input: string): boolean {
    const hasExclamationMarkBeforeTheColon = input.includes('!:');
    return this.applicable === 'always' ? hasExclamationMarkBeforeTheColon : !hasExclamationMarkBeforeTheColon;
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
    const modifier = this.applicable === 'always' ? 'must' : 'must not';
    return `the subject ${modifier} have an exclamation mark before the colon`;
  }
}
