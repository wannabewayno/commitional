import { BaseRuleWithValue } from './BaseRule.js';

export class TrailerRule extends BaseRuleWithValue<string> {
  validate(input: string): boolean {
    const hasTrailer = input.includes(this.value);
    return this.applicable === 'always' ? hasTrailer : !hasTrailer;
  }

  fix(input: string): string | null {
    if (this.applicable === 'always' && !input.includes(this.value)) {
      // Add trailer at the end with a blank line before if needed
      if (input.trim() === '') return this.value;

      if (input.endsWith('\n\n')) return input + this.value;

      if (input.endsWith('\n')) return `${input}\n${this.value}`;

      return `${input}\n\n${this.value}`;
    }

    return null;
  }

  errorMessage(): string {
    const modifier = this.applicable === 'always' ? 'must' : 'must not';
    return `the ${this.name} ${modifier} include the trailer "${this.value}"`;
  }
}
