/**
 * Truncates long text to the maxLength followed by an elipsis to indicate it has been truncated
 * Example:
 * const truncated = truncate('Some very long text that I would like to truncate', 16)
 * console.log(truncated) // 'Some very long t...'
 * @param text - text to truncate
 * @param maxLength - max length of allowed text before truncation
 */
export const truncate = (text: string, maxLength = 75) => {
  const elipsis = '...';
  if (text.length < maxLength) return text;
  return `${text.slice(0, maxLength - elipsis.length)}${elipsis}`;
}