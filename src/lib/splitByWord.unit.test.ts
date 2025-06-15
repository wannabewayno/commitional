import { expect } from 'chai';
import splitByWord from './splitByWord.js';

describe('splitByWord', () => {
  it('should split camelCase words', () => {
    const result = splitByWord('camelCaseText');
    expect(result).to.deep.equal(['camel', 'Case', 'Text']);
  });

  it('should split snake_case words', () => {
    const result = splitByWord('snake_case_text');
    expect(result).to.deep.equal(['snake', 'case', 'text']);
  });

  it('should split kebab-case words', () => {
    const result = splitByWord('kebab-case-text');
    expect(result).to.deep.equal(['kebab', 'case', 'text']);
  });

  it('should split PascalCase words', () => {
    const result = splitByWord('PascalCaseText');
    expect(result).to.deep.equal(['Pascal', 'Case', 'Text']);
  });

  it('should split SCREAMING_SNAKE_CASE words', () => {
    const result = splitByWord('SCREAMING_SNAKE_CASE');
    expect(result).to.deep.equal(['SCREAMING', 'SNAKE', 'CASE']);
  });

  it('should split SCREAMING-KEBAB-CASE words', () => {
    const result = splitByWord('SCREAMING-KEBAB-CASE');
    expect(result).to.deep.equal(['SCREAMING', 'KEBAB', 'CASE']);
  });

  it('should split Start Case words', () => {
    const result = splitByWord('Start Case Text');
    expect(result).to.deep.equal(['Start', 'Case', 'Text']);
  });

  it('should split mixed case words', () => {
    const result = splitByWord('mixed_case-with camelCase');
    expect(result).to.deep.equal(['mixed', 'case', 'with', 'camel', 'Case']);
  });

  it('should handle empty strings', () => {
    const result = splitByWord('');
    expect(result).to.deep.equal(['']);
  });

  it('should handle strings with only delimiters', () => {
    const result = splitByWord('_ - _');
    expect(result).to.deep.equal(['', '', '', '', '', '']);
  });

  it('should handle strings with numbers', () => {
    const result = splitByWord('item1_with2Numbers');
    expect(result).to.deep.equal(['item', '1', 'with', '2Numbers']);
  });

  it('should handle consecutive delimiters', () => {
    const result = splitByWord('double__underscore');
    expect(result).to.deep.equal(['double', '', 'underscore']);
  });
});
