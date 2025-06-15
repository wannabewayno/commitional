import { expect } from 'chai';
import kebabCase from './kebabCase.js';

describe('kebabCase', () => {
  it('should convert camelCase to kebab-case', () => {
    expect(kebabCase('camelCase')).to.equal('camel-case');
    expect(kebabCase('multipleWordCamelCase')).to.equal('multiple-word-camel-case');
  });

  it('should convert PascalCase to kebab-case', () => {
    expect(kebabCase('PascalCase')).to.equal('pascal-case');
    expect(kebabCase('MultipleWordPascalCase')).to.equal('multiple-word-pascal-case');
  });

  it('should convert snake_case to kebab-case', () => {
    expect(kebabCase('snake_case')).to.equal('snake-case');
    expect(kebabCase('multiple_word_snake_case')).to.equal('multiple-word-snake-case');
  });

  it('should convert SCREAMING_SNAKE_CASE to kebab-case', () => {
    expect(kebabCase('SCREAMING_SNAKE_CASE')).to.equal('screaming-snake-case');
  });

  it('should convert space-separated words to kebab-case', () => {
    expect(kebabCase('Space separated words')).to.equal('space-separated-words');
  });

  it('should convert existing kebab-case to lowercase kebab-case', () => {
    expect(kebabCase('kebab-case')).to.equal('kebab-case');
    expect(kebabCase('Kebab-Case')).to.equal('kebab-case');
    expect(kebabCase('KEBAB-CASE')).to.equal('kebab-case');
  });

  it('should handle strings with numbers', () => {
    expect(kebabCase('item1')).to.equal('item-1');
    expect(kebabCase('1item')).to.equal('1-item');
    expect(kebabCase('item123test')).to.equal('item-123-test');
  });

  it('should handle mixed case and delimiter styles', () => {
    expect(kebabCase('mixed_case-with camelCase')).to.equal('mixed-case-with-camel-case');
  });

  it('should handle empty strings', () => {
    expect(kebabCase('')).to.equal('');
  });

  it('should handle strings with only delimiters', () => {
    expect(kebabCase('_ - _')).to.equal('-----');
  });

  it('should handle consecutive delimiters', () => {
    expect(kebabCase('double__underscore')).to.equal('double--underscore');
    expect(kebabCase('double--hyphen')).to.equal('double--hyphen');
    expect(kebabCase('double  space')).to.equal('double--space');
  });
});
