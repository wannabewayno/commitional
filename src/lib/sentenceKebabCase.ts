import capitalize from './capitalize.js';
import kebabCase from './kebabCase.js';

export default function sentaceKebabCase(string: string) {
  return capitalize(kebabCase(string));
}
