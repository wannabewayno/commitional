import { NamespaceAlignmentRule } from './NamespaceAlignmentRule.js';
import type { GitContext } from '../GitContext.js';
import { expect } from 'chai';

describe('NamespaceAlignmentRule', () => {
  let rule: NamespaceAlignmentRule;

  beforeEach(() => {
    rule = new NamespaceAlignmentRule('namespace', 2, 'always', ['apps/myapp/', 'libs/shared/']);
  });

  describe('validate', () => {
    it('should pass when namespace matches files', () => {
      const context: GitContext = {
        files: ['apps/myapp/feature.ts'],
        isStaged: false,
      };

      const result = rule.validate(['myapp'], context);
      expect(result).to.be.null;
    });

    it('should fail when namespace does not match files', () => {
      const context: GitContext = {
        files: ['apps/myapp/feature.ts'],
        isStaged: false,
      };

      const result = rule.validate(['otherapp'], context);
      expect(result).to.not.be.null;
      // biome-ignore lint/style/noNonNullAssertion: It exists, we just checked for it
      expect(result![0]).to.include('Files in apps/myapp require namespace "myapp", got "otherapp"');
    });

    it('should fail when commit spans multiple namespaces', () => {
      const context: GitContext = {
        files: ['apps/myapp/feature.ts', 'libs/shared/util.ts'],
        isStaged: false,
      };

      const result = rule.validate(['myapp'], context);
      expect(result).to.not.be.null;
      // biome-ignore lint/style/noNonNullAssertion: It exists, we just checked for it
      expect(result![0]).to.include('Commit spans multiple namespaces: myapp, shared');
    });

    it('should pass without context', () => {
      const result = rule.validate(['myapp']);
      expect(result).to.be.null;
    });

    it('should pass with empty files', () => {
      const context: GitContext = {
        files: [],
        isStaged: false,
      };

      const result = rule.validate(['myapp'], context);
      expect(result).to.be.null;
    });

    it('should pass for changes made outside of namespaces', () => {
      const context: GitContext = {
        files: ['.github/workflows/my-custom-workflow.yaml'],
        isStaged: false,
      };

      const result = rule.validate([], context);
      expect(result).to.be.null;
    });
  });

  describe('fix', () => {
    it('should not fix non-staged commits', () => {
      const context: GitContext = {
        files: ['apps/myapp/feature.ts'],
        isStaged: false,
      };

      const [errors, parts] = rule.fix(['otherapp'], context);
      expect(errors).to.not.be.null;
      expect(parts).to.deep.equal(['otherapp']);
    });

    it('should return validation errors for staged commits', () => {
      const context: GitContext = {
        files: ['apps/myapp/feature.ts'],
        isStaged: true,
      };

      const [errors, parts] = rule.fix(['otherapp'], context);
      expect(errors).to.not.be.null;
      expect(parts).to.deep.equal(['otherapp']);
    });
  });

  describe('describe', () => {
    it('should return rule description', () => {
      const description = rule.describe();
      expect(description).to.equal('Files must belong to the same namespace as specified in the commit message');
    });
  });
});
