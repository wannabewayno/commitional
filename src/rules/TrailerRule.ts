import { BaseRule } from './BaseRule.js';

export class TrailerRule extends BaseRule<string> {
  validate(input: string): boolean {
    return input.includes(this.value);
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
    return `include the trailer "${this.value}"`;
  }
}
