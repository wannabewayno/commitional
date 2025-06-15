import { expect } from 'chai';
import trainCase from './trainCase.js';

describe('trainCase', () => {
  it('should convert camelCase to Train-Case', () => {
    expect(trainCase('camelCase')).to.equal('Camel-Case');
    expect(trainCase('multipleWordCamelCase')).to.equal('Multiple-Word-Camel-Case');
  });

  it('should convert PascalCase to Train-Case', () => {
    expect(trainCase('PascalCase')).to.equal('Pascal-Case');
    expect(trainCase('MultipleWordPascalCase')).to.equal('Multiple-Word-Pascal-Case');
  });

  it('should convert snake_case to Train-Case', () => {
    expect(trainCase('snake_case')).to.equal('Snake-Case');
    expect(trainCase('multiple_word_snake_case')).to.equal('Multiple-Word-Snake-Case');
  });

  it('should convert kebab-case to Train-Case', () => {
    expect(trainCase('kebab-case')).to.equal('Kebab-Case');
    expect(trainCase('multiple-word-kebab-case')).to.equal('Multiple-Word-Kebab-Case');
  });

  it('should convert SCREAMING_SNAKE_CASE to Train-Case', () => {
    expect(trainCase('SCREAMING_SNAKE_CASE')).to.equal('Screaming-Snake-Case');
  });

  it('should convert SCREAMING-KEBAB-CASE to Train-Case', () => {
    expect(trainCase('SCREAMING-KEBAB-CASE')).to.equal('Screaming-Kebab-Case');
  });

  it('should convert space-separated words to Train-Case', () => {
    expect(trainCase('space separated words')).to.equal('Space-Separated-Words');
  });

  it('should convert sentence case to Train-Case', () => {
    expect(trainCase('Sentence case text')).to.equal('Sentence-Case-Text');
  });

  it('should handle strings with numbers', () => {
    expect(trainCase('item1')).to.equal('Item-1');
    expect(trainCase('1item')).to.equal('1-Item');
    expect(trainCase('item123test')).to.equal('Item-123-Test');
  });

  it('should handle mixed case and delimiter styles', () => {
    expect(trainCase('mixed_case-with camelCase')).to.equal('Mixed-Case-With-Camel-Case');
  });

  it('should handle empty strings', () => {
    expect(trainCase('')).to.equal('');
  });

  it('should handle strings with only delimiters', () => {
    expect(trainCase('_ - _')).to.equal('-----');
  });

  it('should handle consecutive delimiters', () => {
    expect(trainCase('double__underscore')).to.equal('Double--Underscore');
    expect(trainCase('double--hyphen')).to.equal('Double--Hyphen');
    expect(trainCase('double  space')).to.equal('Double--Space');
  });

  it('should capitalize each word, even if already capitalized', () => {
    expect(trainCase('Already Capitalized')).to.equal('Already-Capitalized');
    expect(trainCase('ALREADY CAPITALIZED')).to.equal('Already-Capitalized');
    expect(trainCase('already capitalized')).to.equal('Already-Capitalized');
  });
});
