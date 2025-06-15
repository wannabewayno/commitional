import normalizeDelimiters from './normalizeDelimiters.js';

export default function kebabCase(string: string) {
  return normalizeDelimiters(string, '-').toLowerCase();
}
