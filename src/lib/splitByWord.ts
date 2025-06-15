import normalizeDelimiters from './normalizeDelimiters.js';

export default function splitByWord(string: string) {
  return normalizeDelimiters(string, ' ').split(' ');
}
