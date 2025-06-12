import { expect } from 'chai';
import { ScopeDeducer } from './index.js';

describe('ScopeDeducer', () => {
  describe('constructor', () => {
    it('should handle empty config', () => {
      const deducer = new ScopeDeducer();
      expect(deducer.deduceScope(['file.txt'])).to.be.null;
    });

    it('should handle empty scopes array', () => {
      const deducer = new ScopeDeducer([]);
      expect(deducer.deduceScope(['file.txt'])).to.be.null;
    });
  });

  describe('deduceScope', () => {
    it('should return null for empty staged files', () => {
      const deducer = new ScopeDeducer(['api', 'web']);
      expect(deducer.deduceScope([])).to.be.null;
    });

    it('should deduce scope for direct scope directories', () => {
      const deducer = new ScopeDeducer(['api', 'web']);
      expect(deducer.deduceScope(['api/file.txt'])).to.deep.equal(['api']);
      expect(deducer.deduceScope(['web/file.txt'])).to.deep.equal(['web']);
    });

    it('should handle directories with trailing slash', () => {
      const deducer = new ScopeDeducer(['api/', 'web/']);
      expect(deducer.deduceScope(['api/file.txt'])).to.deep.equal(['api']);
      expect(deducer.deduceScope(['web/file.txt'])).to.deep.equal(['web']);
    });

    it('should deduce scope for wildcard directories', () => {
      const deducer = new ScopeDeducer(['packages/*']);
      expect(deducer.deduceScope(['packages/math-helper/file.txt'])).to.deep.equal(['math-helper']);
      expect(deducer.deduceScope(['packages/ui-components/file.txt'])).to.deep.equal(['ui-components']);
    });

    it('should return null when no scope matches', () => {
      const deducer = new ScopeDeducer(['api', 'web']);
      expect(deducer.deduceScope(['src/file.txt'])).to.be.null;
    });

    it('should handle mixed direct and wildcard scopes', () => {
      const deducer = new ScopeDeducer(['api', 'packages/*']);
      expect(deducer.deduceScope(['api/file.txt'])).to.deep.equal(['api']);
      expect(deducer.deduceScope(['packages/math-helper/file.txt'])).to.deep.equal(['math-helper']);
    });
  });
});
