import capitalize from './capitalize.js';
import splitByWord from './splitByWord.js';

export default function trainCase(string: string) {
  return splitByWord(string)
    .map(v => capitalize(v.toLowerCase()))
    .join('-');
}
