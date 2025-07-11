import { expect } from 'chai';
import wrapText from './wrapText.js';

describe('wrapText', () => {
  describe('Error Handling', () => {
    it('should throw error for wrapping less than 1', () => {
      expect(() => wrapText('This could never be wrapped!', 0)).to.throw('Limit must be greater than 1');
    });
  });

  describe('basic wrapping', () => {
    it('should wrap long text at word boundaries', () => {
      const result = wrapText('This is a very long line that needs to be wrapped', 20);

      expect(result).to.equal('This is a very long\nline that needs to\nbe wrapped');
    });

    it('should leave short text unchanged', () => {
      const result = wrapText('Hello world', 50);

      expect(result).to.equal('Hello world');
    });

    it('should handle text exactly at limit', () => {
      const result = wrapText('Hello world', 11);

      expect(result).to.equal('Hello world');
    });
  });

  describe('word preservation', () => {
    it('should preserve long words that exceed limit', () => {
      const result = wrapText('antidisestablishmentarianism', 10);

      expect(result).to.equal('antidisest\nablishment\narianism');
    });

    it('should handle mixed short and long words', () => {
      const result = wrapText('short antidisestablishmentarianism word', 15);

      expect(result).to.equal('short\nantidisestablis\nhmentarianism\nword');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = wrapText('', 10);

      expect(result).to.equal('');
    });

    it('should handle single word', () => {
      const result = wrapText('hello', 10);

      expect(result).to.equal('hello');
    });

    it('should handle multiple spaces', () => {
      const result = wrapText('word1  word2   word3', 10);

      expect(result).to.equal('word1\nword2\nword3');
    });

    it('should handle very small limit', () => {
      const result = wrapText('a b c d e', 1);

      expect(result).to.equal('a\nb\nc\nd\ne');
    });
  });

  describe('line calculation', () => {
    it('should distribute words correctly across lines', () => {
      const result = wrapText('one two three four five six', 12);

      expect(result).to.equal('one two\nthree four\nfive six');
    });

    it('should handle exact character boundaries', () => {
      const result = wrapText('abc def ghi', 7);

      expect(result).to.equal('abc def\nghi');
    });
  });
});
