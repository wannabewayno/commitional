import { BaseRuleWithValue } from './BaseRule.js';

function wrapLine(line: string, limit: number): string[] {
  // Break the line into words
  const words = line.split(' ');

  let currentLineLength = 0;
  const lines: string[][] = [];

  // loop through the words, first calculating the new character count.
  // then dividing by the line length to find the lineIndex
  for (const word of words) {
    currentLineLength += word.length;
    const lineCount = Math.floor(currentLineLength / limit);
    lines[lineCount] ??= [];
    lines[lineCount].push(word);
  }

  return lines.map(line => line.join(' '));
}

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
        .reduce((lines, currentLine) => lines.concat(wrapLine(currentLine, this.value)), [] as string[]);
      return fixedParagraph.join('\n');
    });

    return fixedParagraphs.join('\n\n');
  }

  errorMessage(): string {
    return `the ${this.name} must be wrapped at ${this.value} characters`;
  }
}
