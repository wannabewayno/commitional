import { BaseRule } from './BaseRule.js';

export class MaxLineLengthRule extends BaseRule<number> {
  validate(input: string): boolean {
    const lines = input.split('\n');
    return !lines.some(line => line.length > this.value);
  }

  fix(input: string): string | null {
    // Truncate each line that exceeds the maximum length
    const lines = input.split('\n');
    let modified = false;

    const fixedLines = lines.map(line => {
      if (line.length > this.value) {
        modified = true;
        return line.substring(0, this.value);
      }
      return line;
    });

    return modified ? fixedLines.join('\n') : null;
  }

  errorMessage(): string {
    return `have lines shorter than ${this.value} characters`;
  }
}
