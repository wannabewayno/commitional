import { expect } from 'chai';
import sentenceKebabCase from './sentenceKebabCase.js';

describe('sentenceKebabCase', () => {
  it('should convert camelCase to Sentence-kebab-case', () => {
    expect(sentenceKebabCase('camelCase')).to.equal('Camel-case');
    expect(sentenceKebabCase('multipleWordCamelCase')).to.equal('Multiple-word-camel-case');
  });

  it('should convert PascalCase to Sentence-kebab-case', () => {
    expect(sentenceKebabCase('PascalCase')).to.equal('Pascal-case');
    expect(sentenceKebabCase('MultipleWordPascalCase')).to.equal('Multiple-word-pascal-case');
  });

  it('should convert snake_case to Sentence-kebab-case', () => {
    expect(sentenceKebabCase('snake_case')).to.equal('Snake-case');
    expect(sentenceKebabCase('multiple_word_snake_case')).to.equal('Multiple-word-snake-case');
  });

  it('should convert SCREAMING_SNAKE_CASE to Sentence-kebab-case', () => {
    expect(sentenceKebabCase('SCREAMING_SNAKE_CASE')).to.equal('Screaming-snake-case');
  });

  it('should convert space-separated words to Sentence-kebab-case', () => {
    expect(sentenceKebabCase('space separated words')).to.equal('Space-separated-words');
  });

  it('should convert existing kebab-case to Sentence-kebab-case', () => {
    expect(sentenceKebabCase('kebab-case')).to.equal('Kebab-case');
    expect(sentenceKebabCase('KEBAB-CASE')).to.equal('Kebab-case');
  });

  it('should preserve capitalization of the first letter if already capitalized', () => {
    expect(sentenceKebabCase('Sentence case')).to.equal('Sentence-case');
    expect(sentenceKebabCase('Kebab-case')).to.equal('Kebab-case');
  });

  it('should handle strings with numbers', () => {
    expect(sentenceKebabCase('item1')).to.equal('Item-1');
    expect(sentenceKebabCase('1item')).to.equal('1-item');
    expect(sentenceKebabCase('item123test')).to.equal('Item-123-test');
  });

  it('should handle mixed case and delimiter styles', () => {
    expect(sentenceKebabCase('mixed_case-with camelCase')).to.equal('Mixed-case-with-camel-case');
  });

  it('should handle empty strings', () => {
    expect(sentenceKebabCase('')).to.equal('');
  });

  it('should handle strings with only delimiters', () => {
    expect(sentenceKebabCase('_ - _')).to.equal('-----');
  });

  it('should handle consecutive delimiters', () => {
    expect(sentenceKebabCase('double__underscore')).to.equal('Double--underscore');
    expect(sentenceKebabCase('double--hyphen')).to.equal('Double--hyphen');
    expect(sentenceKebabCase('double  space')).to.equal('Double--space');
  });
});
