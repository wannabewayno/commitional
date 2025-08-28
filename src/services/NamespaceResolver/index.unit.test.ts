import { NamespaceResolver } from './index.js';
import { expect } from 'chai';

describe('NamespaceResolver', () => {
  describe('constructor', () => {
    it('should handle empty patterns', () => {
      const resolver = new NamespaceResolver([]);
      expect(resolver.resolveFileNamespaces(['apps/myapp/file.ts'])).to.be.empty;
    });

    it('should parse wildcard patterns', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      const namespaces = resolver.resolveFileNamespaces(['apps/myapp/file.ts', 'apps/shared/util.ts']);
      expect(namespaces).to.deep.equal(['myapp', 'shared']);
    });

    it('should parse direct patterns', () => {
      const resolver = new NamespaceResolver(['libs/shared']);
      const namespaces = resolver.resolveFileNamespaces(['libs/shared/util.ts']);
      expect(namespaces).to.deep.equal(['shared']);
    });
  });

  describe('getFileNamespace', () => {
    it('should return null for root files', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      expect(resolver.getFileNamespace('README.md')).to.be.null;
      expect(resolver.getFileNamespace('package.json')).to.be.null;
    });

    it('should resolve wildcard namespace', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      expect(resolver.getFileNamespace('apps/myapp/feature.ts')).to.equal('myapp');
      expect(resolver.getFileNamespace('apps/shared/util.ts')).to.equal('shared');
    });

    it('should resolve direct namespace', () => {
      const resolver = new NamespaceResolver(['libs/shared']);
      expect(resolver.getFileNamespace('libs/shared/util.ts')).to.equal('shared');
    });

    it('should return null for non-matching files', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      expect(resolver.getFileNamespace('libs/shared/util.ts')).to.be.null;
      expect(resolver.getFileNamespace('tools/build.js')).to.be.null;
    });
  });

  describe('resolveFileNamespaces', () => {
    it('should resolve multiple files to namespaces', () => {
      const resolver = new NamespaceResolver(['apps/*', 'libs/*']);
      const files = ['apps/myapp/feature.ts', 'apps/myapp/auth.ts', 'libs/shared/util.ts', 'README.md'];

      const namespaces = resolver.resolveFileNamespaces(files);
      expect(namespaces).to.deep.equal(['myapp', 'shared']);
    });

    it('should handle empty file list', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      expect(resolver.resolveFileNamespaces([])).to.be.empty;
    });

    it('should deduplicate namespaces', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      const files = ['apps/myapp/feature.ts', 'apps/myapp/auth.ts', 'apps/myapp/utils.ts'];

      const namespaces = resolver.resolveFileNamespaces(files);
      expect(namespaces).to.deep.equal(['myapp']);
    });
  });

  describe('validateSingleNamespace', () => {
    it('should pass for single namespace', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      const files = ['apps/myapp/feature.ts', 'apps/myapp/auth.ts'];

      const result = resolver.validateSingleNamespace(files);
      expect(result.valid).to.be.true;
      expect(result.namespaces).to.deep.equal(['myapp']);
      expect(result.errors).to.be.empty;
    });

    it('should pass for no namespaces (root files)', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      const files = ['README.md', 'package.json'];

      const result = resolver.validateSingleNamespace(files);
      expect(result.valid).to.be.true;
      expect(result.namespaces).to.be.empty;
      expect(result.errors).to.be.empty;
    });

    it('should fail for multiple namespaces', () => {
      const resolver = new NamespaceResolver(['apps/*', 'libs/*']);
      const files = ['apps/myapp/feature.ts', 'libs/shared/util.ts'];

      const result = resolver.validateSingleNamespace(files);
      expect(result.valid).to.be.false;
      expect(result.namespaces).to.deep.equal(['myapp', 'shared']);
      expect(result.errors).to.include('Commit spans multiple namespaces: myapp, shared');
    });
  });

  describe('validateNamespaceAlignment', () => {
    it('should pass when commit namespace matches file namespace', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      const files = ['apps/myapp/feature.ts'];

      const result = resolver.validateNamespaceAlignment('myapp', files);
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should fail when commit has namespace but files do not', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      const files = ['README.md'];

      const result = resolver.validateNamespaceAlignment('myapp', files);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('Files not apart of namespace "myapp"');
    });

    it('should fail when commit missing required namespace', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      const files = ['apps/myapp/feature.ts'];

      const result = resolver.validateNamespaceAlignment('', files);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('Files in apps/myapp require namespace "myapp"');
    });

    it('should fail when commit has wrong namespace', () => {
      const resolver = new NamespaceResolver(['apps/*']);
      const files = ['apps/myapp/feature.ts'];

      const result = resolver.validateNamespaceAlignment('otherapp', files);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('Files in apps/myapp require namespace "myapp", got "otherapp"');
    });
  });
});
