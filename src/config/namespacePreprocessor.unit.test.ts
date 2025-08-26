import { preprocessNamespaceConfig } from './namespacePreprocessor.js';
import type { CommitlintConfig } from './index.js';
import { expect } from 'chai';
import { mkdirSync, rmSync } from 'node:fs';

describe('Namespace Preprocessor', () => {
  const testDir = 'test-namespace-preprocessing';

  beforeEach(() => {
    // Create test directory structure
    mkdirSync(`${testDir}/apps/myapp`, { recursive: true });
    mkdirSync(`${testDir}/apps/otherapp`, { recursive: true });
    mkdirSync(`${testDir}/libs/shared`, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir('..');
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('pattern expansion', () => {
    it('should expand wildcard patterns to actual directories', () => {
      const config = {
        rules: {
          'namespace-enum': [2, 'always', ['apps/*', 'libs/*']],
        } as CommitlintConfig['rules'],
      };

      preprocessNamespaceConfig(config);

      expect(config.rules['namespace-enum']?.[2]).to.include.members(['myapp', 'otherapp', 'shared']);
    });

    it('should preserve static patterns', () => {
      const config = {
        rules: {
          'namespace-enum': [2, 'always', ['apps/*', 'tools/build']],
        } as CommitlintConfig['rules'],
      };

      preprocessNamespaceConfig(config);

      expect(config.rules['namespace-enum']?.[2]).to.include.members(['myapp', 'otherapp', 'build']);
    });

    it('should create namespace-alignment rule with paths', () => {
      const config = {
        rules: {
          'namespace-enum': [2, 'always', ['apps/*']],
        } as CommitlintConfig['rules'],
      };

      preprocessNamespaceConfig(config);

      expect(config.rules['namespace-alignment']).to.exist;
      expect(config.rules['namespace-alignment']?.[0]).to.equal(2);
      expect(config.rules['namespace-alignment']?.[1]).to.equal('always');
      expect(config.rules['namespace-alignment']?.[2]).to.include('apps/myapp/');
    });
  });

  describe('edge cases', () => {
    it('should handle config without namespace-enum', () => {
      const config = {
        rules: {
          'type-enum': [2, 'always', ['feat', 'fix']],
        } as CommitlintConfig['rules'],
      };

      preprocessNamespaceConfig(config);

      expect(config).to.deep.equal(config);
    });

    it('should handle empty patterns array', () => {
      const config = {
        rules: {
          'namespace-enum': [2, 'always', []],
        } as CommitlintConfig['rules'],
      };

      preprocessNamespaceConfig(config);

      expect(config.rules['namespace-enum']?.[2]).to.be.empty;
    });

    it('should handle patterns ending with slash', () => {
      const config = {
        rules: {
          'namespace-enum': [2, 'always', ['apps/']],
        } as CommitlintConfig['rules'],
      };

      preprocessNamespaceConfig(config);

      expect(config.rules['namespace-enum']?.[2]).to.include.members(['myapp', 'otherapp']);
    });
  });
});
