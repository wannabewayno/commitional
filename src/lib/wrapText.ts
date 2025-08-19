import extract from './extract.js';

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

  const lines: string[] = [];

  while (text.length > limit) {
    console.log({ text });
    const tail = text.slice(limit);

    const [partial, head] = /^\w/.test(tail) ? extract(text.slice(0, limit), /\w+$/) : ['', text.slice(0, limit)];
    console.log({ partial, head, tail });

    if (head) lines.push(head.trim());

    if (partial.length === limit) {
      lines.push(partial.trim());
      text = tail;
    } else text = (partial + tail).trim();
  }
  // Push what ever is left over as the last line.
  lines.push(text.trim());

  return lines.join('\n');
}
