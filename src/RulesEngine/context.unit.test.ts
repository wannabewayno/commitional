import RulesEngine from './index.js';
import type { GitContext } from './GitContext.js';
import { expect } from 'chai';

describe('RulesEngine - Context Management', () => {
  let rulesEngine: RulesEngine;

  beforeEach(() => {
    rulesEngine = RulesEngine.fromRules({
      'subject-empty': [2, 'never'],
    });
  });

  describe('setContext', () => {
    it('should set git context without errors', () => {
      const context: GitContext = {
        files: ['apps/myapp/file.ts'],
        isStaged: true,
      };

      // Should not throw
      expect(() => rulesEngine.setContext(context)).to.not.throw();
    });
  });

  describe('clearContext', () => {
    it('should clear git context without errors', () => {
      const context: GitContext = {
        files: ['apps/myapp/file.ts'],
        isStaged: true,
      };

      rulesEngine.setContext(context);

      // Should not throw
      expect(() => rulesEngine.clearContext()).to.not.throw();
    });
  });

  describe('context passing to rules', () => {
    it('should validate successfully with context', () => {
      const context: GitContext = {
        files: ['apps/myapp/file.ts'],
        isStaged: false,
      };

      rulesEngine.setContext(context);

      // Valid commit should pass
      const [_output, errors] = rulesEngine.validate(['test subject']);
      expect(errors).to.be.empty;
    });

    it('should validate successfully without context', () => {
      // Valid commit should pass without context
      const [_output, errors] = rulesEngine.validate(['test subject']);
      expect(errors).to.be.empty;
    });

    it('should fail validation for empty subject regardless of context', () => {
      const context: GitContext = {
        files: ['apps/myapp/file.ts'],
        isStaged: true,
      };

      rulesEngine.setContext(context);

      // Empty subject should fail
      const [_output, errors] = rulesEngine.validate(['']);
      expect(errors).to.not.be.empty;
      expect(errors[0]).to.contain('[subject:0]');
    });
  });
});
