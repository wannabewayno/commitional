import extract from './extract.js';

function trimSpaces(text: string) {
  return text.replace(/^ +| +$/g, '');
}

class Paragraph {
  constructor(public content = '') {}

  line(line: string) {
    if (!line.startsWith('\n')) line = `\n${line}`;
    this.content += line;
  }
}

/**
 * Wraps text to fit within a specified character limit by breaking at word boundaries.
 *
 * @param line - The input text to wrap
 * @param limit - Maximum characters per line
 * @returns Multi-line string with lines separated by newline characters
 *
 * @example
 * // Wrap long text for terminal display
 * const wrapped = wrapText('This is a very long line that needs to be wrapped', 20);
 * // Returns:
 * // 'This is a very long\nline that needs to be\nwrapped'
 *
 * // Short text remains unchanged
 * const short = wrapText('Hello world', 50);
 * // Returns: 'Hello world'
 *
 * // Single word longer than limit
 * const longWord = wrapText('antidisestablishmentarianism', 10);
 */
export default function wrapText(text: string, limit: number): string {
  if (limit < 1) throw new Error('Limit must be greater than 1');

  const paragraph = new Paragraph();

  while (text.length > limit) {
    const tail = text.slice(limit);

    const [partial, head] = /^\w/.test(tail) ? extract(text.slice(0, limit), /\w+$/) : ['', text.slice(0, limit)];

    if (head) paragraph.line(trimSpaces(head));

    if (partial.length === limit) {
      paragraph.line(trimSpaces(partial));
      text = tail;
    } else text = trimSpaces(partial + tail);
  }
  // Push what ever is left over as the last line.
  paragraph.line(text.trim());

  return paragraph.content.trim();
}
