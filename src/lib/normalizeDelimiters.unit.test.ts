import { expect } from 'chai';
import normalizeDelimiters from './normalizeDelimiters.js';

describe('normalizeDelimiter function', () => {
  describe('with default space normalizeDelimiter', () => {
    it('should normalize snake_case', () => {
      expect(normalizeDelimiters('snake_case')).to.equal('snake case');
      expect(normalizeDelimiters('multiple_word_snake_case')).to.equal('multiple word snake case');
    });

    it('should normalize kebab-case', () => {
      expect(normalizeDelimiters('kebab-case')).to.equal('kebab case');
      expect(normalizeDelimiters('multiple-word-kebab-case')).to.equal('multiple word kebab case');
    });

    it('should normalize SCREAMING_SNAKE_CASE', () => {
      expect(normalizeDelimiters('SCREAMING_SNAKE_CASE')).to.equal('SCREAMING SNAKE CASE');
    });

    it('should normalize SCREAMING-KEBAB-CASE', () => {
      expect(normalizeDelimiters('SCREAMING-KEBAB-CASE')).to.equal('SCREAMING KEBAB CASE');
    });

    it('should normalize Start Case', () => {
      expect(normalizeDelimiters('Start Case')).to.equal('Start Case');
    });

    it('should add spaces at camelCase transitions', () => {
      expect(normalizeDelimiters('camelCase')).to.equal('camel Case');
      expect(normalizeDelimiters('multipleWordCamelCase')).to.equal('multiple Word Camel Case');
    });

    it('should add spaces at PascalCase transitions', () => {
      expect(normalizeDelimiters('PascalCase')).to.equal('Pascal Case');
    });

    it('should add spaces between numbers and letters', () => {
      expect(normalizeDelimiters('item1')).to.equal('item 1');
      expect(normalizeDelimiters('1item')).to.equal('1 item');
      expect(normalizeDelimiters('item123test')).to.equal('item 123 test');
    });

    it('should normalize mixed case sentences', () => {
      expect(normalizeDelimiters('snake_case kebab-case camelCase PascalCase Start Case SCREAMING_SNAKE_CASE')).to.equal(
        'snake case kebab case camel Case Pascal Case Start Case SCREAMING SNAKE CASE',
      );
    });
  });

  describe('with custom normalizeDelimiters', () => {
    it('should normalize with hyphen normalizeDelimiter', () => {
      expect(normalizeDelimiters('snake_case', '-')).to.equal('snake-case');
      expect(normalizeDelimiters('kebab-case', '-')).to.equal('kebab-case');
      expect(normalizeDelimiters('camelCase', '-')).to.equal('camel-Case');
      expect(normalizeDelimiters('Start Case', '-')).to.equal('Start-Case');
    });

    it('should normalize with underscore normalizeDelimiter', () => {
      expect(normalizeDelimiters('snake_case', '_')).to.equal('snake_case');
      expect(normalizeDelimiters('kebab-case', '_')).to.equal('kebab_case');
      expect(normalizeDelimiters('camelCase', '_')).to.equal('camel_Case');
      expect(normalizeDelimiters('Start Case', '_')).to.equal('Start_Case');
    });

    it('should normalize with custom normalizeDelimiter', () => {
      expect(normalizeDelimiters('snake_case', '+')).to.equal('snake+case');
      expect(normalizeDelimiters('kebab-case', '+')).to.equal('kebab+case');
      expect(normalizeDelimiters('camelCase', '+')).to.equal('camel+Case');
      expect(normalizeDelimiters('Start Case', '+')).to.equal('Start+Case');
    });

    it('should normalize mixed case sentences with custom normalizeDelimiter', () => {
      expect(normalizeDelimiters('snake_case kebab-case camelCase PascalCase', '_')).to.equal(
        'snake_case_kebab_case_camel_Case_Pascal_Case',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(normalizeDelimiters('')).to.equal('');
    });

    it('should handle strings with no normalizeDelimiters', () => {
      expect(normalizeDelimiters('word')).to.equal('word');
    });

    it('should handle strings with only normalizeDelimiters', () => {
      expect(normalizeDelimiters('_ - _')).to.equal('     ');
    });

    it('should handle consecutive normalizeDelimiters', () => {
      expect(normalizeDelimiters('double__underscore')).to.equal('double  underscore');
      expect(normalizeDelimiters('double--hyphen')).to.equal('double  hyphen');
      expect(normalizeDelimiters('double  space')).to.equal('double  space');
    });

    it('should handle mixed number and letter sequences', () => {
      expect(normalizeDelimiters('mix3d_numb3rs-and_l3tt3rs')).to.equal('mix 3d numb 3rs and l 3tt 3rs');
    });
  });
});
