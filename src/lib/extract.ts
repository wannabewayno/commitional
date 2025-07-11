/**
 * Extracts the first match of a pattern from text and returns both the match and the modified text.
 *
 * @param text - The input text to search within
 * @param regex - Pattern to match (RegExp or string)
 * @returns A tuple containing [extracted match, text with match removed]
 *
 * @example
 * // Extract error code from output
 * const [errorCode, cleanOutput] = extract('Error: E001 Invalid input', /E\d+/);
 * // errorCode: 'E001'
 * // cleanOutput: 'Error:  Invalid input'
 *
 * // Extract timestamp
 * const [timestamp, message] = extract('[2024-01-15] Server started', /\[\d{4}-\d{2}-\d{2}\]/);
 * // timestamp: '[2024-01-15]'
 * // message: ' Server started'
 *
 * // No match found
 * const [nothing, original] = extract('Hello world', /\d+/);
 * // nothing: ''
 * // original: 'Hello world'
 */
export default function extract(text: string, regex: RegExp | string): [extracted: string, modified: string] {
  if (regex instanceof RegExp && regex.global) regex = new RegExp(regex.source, regex.flags.replace('g', ''));

  let extracted = '';
  text = text.replace(regex, match => {
    extracted = match;
    return '';
  });

  return [extracted, text];
}
