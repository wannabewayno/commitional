import { describe, it } from 'mocha';
import { strict as assert } from 'node:assert';
import {
  isGitRepository,
  getStagedFiles,
  getStagedDiff,
} from './gitUtils.js';

describe('Git Utilities', () => {
  describe('isGitRepository', () => {
    it('should detect if current directory is a git repository', async () => {
      const result = await isGitRepository();
      // Since we're running tests in the project directory, it should be a git repo
      assert.equal(result, true);
    });
  });


  describe('getStagedFiles', () => {
    it('should return an array of staged files', async () => {
      const files = await getStagedFiles();
      assert(Array.isArray(files));
    });
  });

  describe('getStagedDiff', () => {
    it('should return staged changes diff', async () => {
      const diff = await getStagedDiff();
      assert(typeof diff === 'string');
    });
  });
});