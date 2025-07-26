import wrapText from '../../lib/wrapText.js';
import { BaseRuleWithValue } from './BaseRule.js';

export class MaxLineLengthRule extends BaseRuleWithValue<number> {
  validate(input: string): boolean {
    const lines = input.split('\n');
    return !lines.some(line => line.length > this.value);
  }

  fix(input: string): string | null {
    // Split by paragraphs
    const paragraphs = input.split('\n\n');

    // fix each paragraph to wrap the content to the line limit
    const fixedParagraphs = paragraphs.map(paragraph => {
      const fixedParagraph = paragraph
        .split('\n')
        .reduce((lines, currentLine) => lines.concat(wrapText(currentLine, this.value)), [] as string[]);
      return fixedParagraph.join('\n');
    });

    return fixedParagraphs.join('\n\n');
  }

  errorMessage(): string {
    return `the ${this.name} must be wrapped at ${this.value} characters`;
  }
}
