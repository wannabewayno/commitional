import TestGitRepo from './fixtures/TestGitRepo.js';
import CommitlintConfigBuilder from './fixtures/CommitlintConfigBuilder.js';
import Cliete from 'cliete';
import { expect } from 'chai';
import path from 'node:path';

describe('Lint Command E2E Tests', () => {
  describe('Command arguments', () => {
    describe('Invalid Commits', () => {
      let repo: TestGitRepo;
      const commits: string[] = [];

      before(() => {
        repo = new TestGitRepo();
        new CommitlintConfigBuilder(repo)
          .typeEnum(['feat', 'fix', 'docs', 'chore'])
          .subjectCase('sentence-case')
          .commitAsYaml();

        // Create 3 invalid commits
        commits.unshift(
          repo
            .addTextFile('invalid-commit-1', 'Incorrect type enum 1 - not fixable', { stage: true })
            .commit('bug: Fix things'),
        );

        commits.unshift(
          repo
            .addTextFile('invalid-commit-2', 'Incorrect type enum 2 - not fixable', { stage: true })
            .commit('bug: Fix things again'),
        );

        commits.unshift(
          repo
            .addTextFile('invalid-commit-3', 'Incorrect type enum 3 - not fixable', { stage: true })
            .commit('bug: Fix things final'),
        );

        // Set defaults
        Cliete.setDefault('cwd', repo.tempDir);
        Cliete.setDefault('width', 120);
        Cliete.setDefault('height', 60);
      });

      after(() => {
        // Clean up temp directory
        repo.teardown();
      });

      describe('Hash Arguments', () => {
        it('should lint a single commit by full hash', async () => {
          // biome-ignore lint/style/noNonNullAssertion: We know it exists
          const commitHash = commits.at(-1)!;
          const I = await Cliete.openTerminal(`commitional lint ${commitHash}`);

          await I.wait.until.I.see(
            '---',
            'bug: Fix things',
            '',
            '[type]',
            "- The type can only be one of: 'feat', 'fix', 'docs' or 'chore'",
            '',
          );

          await I.wait.until.the.process.exits.with.nonZero.exit.code;
        });

        it('should lint a single commit by short hash', async () => {
          // biome-ignore lint/style/noNonNullAssertion: We know it exists
          const commitHash = commits.at(-1)!;
          const shortHash = commitHash.slice(0, 7);
          const I = await Cliete.openTerminal(`commitional lint ${shortHash}`);

          await I.wait.until.I.see(
            '---',
            'bug: Fix things',
            '',
            '[type]',
            "- The type can only be one of: 'feat', 'fix', 'docs' or 'chore'",
            '',
          );

          await I.wait.until.the.process.exits.with.nonZero.exit.code;
        });

        it('should handle invalid commit hash', async () => {
          const I = await Cliete.openTerminal('commitional lint blarhgg', { timeout: null });

          await I.wait.for.the.process.to.exit.with.exit.code.zero;
          await I.see('');
        });
      });

      describe('Hash Range Arguments', () => {
        it('should lint commits in a hash range', async () => {
          const I = await Cliete.openTerminal(`commitional lint ${commits[0]}...${commits[2]}`);

          await I.wait.until.I.see(
            '---',
            'bug: Fix things final',
            '',
            '[type]',
            "- The type can only be one of: 'feat', 'fix', 'docs' or 'chore'",
            '',
            '---',
            'bug: Fix things again',
            '',
            '[type]',
            "- The type can only be one of: 'feat', 'fix', 'docs' or 'chore'",
            '',
          );

          await I.wait.for.the.process.to.exit.with.nonZero.exit.code;
        });

        it('should handle invalid hash range', async () => {
          const I = await Cliete.openTerminal('commitional lint 1234abc...5678def', { timeout: null });

          await I.wait.for.the.process.to.exit.with.exit.code.zero;
          await I.see('');
        });
      });

      describe('Integer Arguments', () => {
        it('should lint last commit', async () => {
          const I = await Cliete.openTerminal('commitional lint 1');

          await I.wait.until.I.see(
            '---',
            'bug: Fix things final',
            '',
            '[type]',
            "- The type can only be one of: 'feat', 'fix', 'docs' or 'chore'",
            '',
          );

          await I.wait.until.the.process.exits.with.nonZero.exit.code;
        });

        it('should lint the last 2 commits', async () => {
          const I = await Cliete.openTerminal('commitional lint 2');

          await I.wait.until.I.see(
            '---',
            'bug: Fix things final',
            '',
            '[type]',
            "- The type can only be one of: 'feat', 'fix', 'docs' or 'chore'",
            '',
            '---',
            'bug: Fix things again',
            '',
            '[type]',
            "- The type can only be one of: 'feat', 'fix', 'docs' or 'chore'",
            '',
          );

          await I.wait.until.the.process.exits.with.nonZero.exit.code;
        });
      });

      describe('Commit Message File', () => {
        const commitMsg = 'COMMITMSG';
        let commitMsgPath: string;

        beforeEach(() => {
          repo.addFile(commitMsg, 'feat: fixable commit');
          commitMsgPath = path.join(repo.tempDir, commitMsg);
        });

        afterEach(() => {
          repo.removeFile(commitMsg);
        });

        // Create a Commit Message path.
        it('should lint commit message from file', async () => {
          const I = await Cliete.openTerminal(`commitional lint ${commitMsgPath}`);

          await I.wait.until.I.see(
            '---',
            'feat: fixable commit',
            '',
            '[subject]',
            '- The subject must always be in Sentence case',
            '',
          );

          await I.wait.until.the.process.exits.with.nonZero.exit.code;
        });

        it('should fix commit message file when --fix is used', async () => {
          const I = await Cliete.openTerminal(`commitional lint ${commitMsgPath} --fix`, { timeout: null });

          await I.wait.for.the.process.to.exit.with.exit.code.zero;
          await I.see('');

          // Expect file to be changed
          const fixedCommit = repo.getFileContents(commitMsg);
          expect(fixedCommit).to.equal('feat: Fixable commit');
        });

        it('should handle non-existent file', async () => {
          const I = await Cliete.openTerminal('commitional lint i-do-not-exist', { timeout: null });

          await I.wait.for.the.process.to.exit.with.exit.code.zero;
          await I.see('');
        });
      });
    });
  });

  describe('Rules', () => {});
});
