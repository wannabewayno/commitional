import { expect } from 'chai';
import extract from './extract.js';

describe('extract', () => {
  describe('RegExp patterns', () => {
    it('should extract first match and remove it from text', () => {
      const [extracted, modified] = extract('Error: E001 Invalid input', /E\d+/);

      expect(extracted).to.equal('E001');
      expect(modified).to.equal('Error:  Invalid input');
    });

    it('should extract timestamp pattern', () => {
      const [extracted, modified] = extract('[2024-01-15] Server started', /\[\d{4}-\d{2}-\d{2}\]/);

      expect(extracted).to.equal('[2024-01-15]');
      expect(modified).to.equal(' Server started');
    });

    it('should return empty string when no match found', () => {
      const [extracted, modified] = extract('Hello world', /\d+/);

      expect(extracted).to.equal('');
      expect(modified).to.equal('Hello world');
    });

    it('should only extract first match when multiple exist', () => {
      const [extracted, modified] = extract('E001 and E002 errors', /E\d+/);

      expect(extracted).to.equal('E001');
      expect(modified).to.equal(' and E002 errors');
    });

    it('should only extract first match when multiple exist and the global flag is present', () => {
      const [extracted, modified] = extract('E001 and E002 errors', /E\d+/g);

      expect(extracted).to.equal('E001');
      expect(modified).to.equal(' and E002 errors');
    });
  });

  describe('string patterns', () => {
    it('should extract literal string match', () => {
      const [extracted, modified] = extract('Hello world test', 'world');

      expect(extracted).to.equal('world');
      expect(modified).to.equal('Hello  test');
    });

    it('should return empty when string not found', () => {
      const [extracted, modified] = extract('Hello world', 'xyz');

      expect(extracted).to.equal('');
      expect(modified).to.equal('Hello world');
    });
  });

  describe('edge cases', () => {
    it('should handle empty input text', () => {
      const [extracted, modified] = extract('', /\d+/);

      expect(extracted).to.equal('');
      expect(modified).to.equal('');
    });

    it('should handle match at beginning of text', () => {
      const [extracted, modified] = extract('E001 Error occurred', /E\d+/);

      expect(extracted).to.equal('E001');
      expect(modified).to.equal(' Error occurred');
    });

    it('should handle match at end of text', () => {
      const [extracted, modified] = extract('Error code: E001', /E\d+/);

      expect(extracted).to.equal('E001');
      expect(modified).to.equal('Error code: ');
    });

    it('should handle full text match', () => {
      const [extracted, modified] = extract('E001', /E\d+/);

      expect(extracted).to.equal('E001');
      expect(modified).to.equal('');
    });
  });
});
