import TestGitRepo from './fixtures/TestGitRepo.js';
import CommitlintConfigBuilder from './fixtures/CommitlintConfigBuilder.js';
import Cliete from 'cliete';
import { expect } from 'chai';

describe('Namespace E2E Tests', () => {
  let repo: TestGitRepo;

  beforeEach(() => {
    repo = new TestGitRepo();
    Cliete.setDefault('cwd', repo.tempDir);
    Cliete.setDefault('width', 120);
    Cliete.setDefault('height', 60);
    Cliete.setDefault('timeout', null);
  });

  afterEach(() => {
    repo.teardown();
  });

  describe('Valid Namespace Commits', () => {
    beforeEach(() => {
      new CommitlintConfigBuilder(repo).namespaceEnum(['apps/*', 'libs/*']).namespaceEmpty('never').commitAsYaml();
    });

    it('should accept commit with namespace only', async () => {
      repo.addTextFile('apps/myapp/feature.ts', 'export const feature = true;', { stage: true });

      repo.addFile('.git/COMMIT_EDITMSG', 'feat(myapp): add new feature');
      const I = await Cliete.openTerminal('commitional lint HEAD --fix');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should accept commit with namespace and scope', async () => {
      repo.addTextFile('apps/myapp/auth.ts', 'export const auth = true;', { stage: true });

      const I = await Cliete.openTerminal('commitional lint .git/COMMIT_EDITMSG --fix');
      repo.addFile('COMMIT_EDITMSG', 'feat(myapp>auth): add login system');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should accept commit with libs namespace', async () => {
      repo.addTextFile('libs/shared/utils.ts', 'export const utils = true;', { stage: true });

      const I = await Cliete.openTerminal('commitional lint .git/COMMIT_EDITMSG --fix');
      repo.addFile('COMMIT_EDITMSG', 'feat(shared): add utility functions');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should accept root files without namespace', async () => {
      repo.addTextFile('README.md', '# Project', { stage: true });

      const I = await Cliete.openTerminal('commitional lint .git/COMMIT_EDITMSG --fix');
      repo.addFile('COMMIT_EDITMSG', 'docs: update readme');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });
  });

  describe('Invalid Namespace Commits', () => {
    beforeEach(() => {
      new CommitlintConfigBuilder(repo).namespaceEnum(['apps/*', 'libs/*']).namespaceEmpty('never').commitAsYaml();
    });

    it('should reject commit missing namespace for namespaced files', async () => {
      repo.addTextFile('apps/myapp/feature.ts', 'export const feature = true;', { stage: true });

      const I = await Cliete.openTerminal('commitional lint .git/COMMIT_EDITMSG');
      repo.addFile('COMMIT_EDITMSG', 'feat: add new feature');

      await I.wait.until.I.see(
        '---',
        'feat: add new feature',
        '',
        '[namespace]',
        '- Files in apps/myapp require namespace "myapp"',
        '',
      );

      await I.wait.until.the.process.exits.with.nonZero.exit.code;
    });

    it('should reject commit with wrong namespace', async () => {
      repo.addTextFile('apps/myapp/feature.ts', 'export const feature = true;', { stage: true });

      const I = await Cliete.openTerminal('commitional lint .git/COMMIT_EDITMSG');
      repo.addFile('COMMIT_EDITMSG', 'feat(otherapp): add new feature');

      await I.wait.until.I.see(
        '---',
        'feat(otherapp): add new feature',
        '',
        '[namespace]',
        '- Files in apps/myapp require namespace "myapp", got "otherapp"',
        '',
      );

      await I.wait.until.the.process.exits.with.nonZero.exit.code;
    });

    it('should reject commit spanning multiple namespaces', async () => {
      repo.addTextFile('apps/myapp/feature.ts', 'export const feature = true;', { stage: true });
      repo.addTextFile('libs/shared/utils.ts', 'export const utils = true;', { stage: true });

      const I = await Cliete.openTerminal('commitional lint .git/COMMIT_EDITMSG');
      repo.addFile('COMMIT_EDITMSG', 'feat(myapp): add feature and utils');

      await I.wait.until.I.see(
        '---',
        'feat(myapp): add feature and utils',
        '',
        '[namespace]',
        '- Commit spans multiple namespaces: myapp, shared',
        '',
      );

      await I.wait.until.the.process.exits.with.nonZero.exit.code;
    });

    it('should reject invalid namespace not in enum', async () => {
      repo.addTextFile('apps/myapp/feature.ts', 'export const feature = true;', { stage: true });

      const I = await Cliete.openTerminal('commitional lint .git/COMMIT_EDITMSG');
      repo.addFile('COMMIT_EDITMSG', 'feat(invalidns): add new feature');

      await I.wait.until.I.see(
        '---',
        'feat(invalidns): add new feature',
        '',
        '[namespace]',
        '- Namespace must be one of: myapp, shared',
        '',
      );

      await I.wait.until.the.process.exits.with.nonZero.exit.code;
    });

    it('should not handle complex nested scopes', async () => {
      repo.addTextFile('apps/myapp/feature.ts', 'export const feature = true;', { stage: true });

      const I = await Cliete.openTerminal('commitional lint .git/COMMIT_EDITMSG');
      repo.addFile('COMMIT_EDITMSG', 'feat(myapp>auth>session): add session management');

      await I.wait.for.the.process.to.exit.with.nonZero.exit.code;
      await I.spot('[namespace]');
      await I.spot('- Not allowed!');
    });
  });

  describe('Namespace Parsing', () => {
    beforeEach(() => {
      new CommitlintConfigBuilder(repo).namespaceEnum(['apps/*']).commitAsYaml();
    });

    it('should parse namespace only format', async () => {
      repo.addTextFile('apps/myapp/feature.ts', 'export const feature = true;', { stage: true });

      const I = await Cliete.openTerminal('commitional lint .git/COMMIT_EDITMSG');
      repo.addFile('COMMIT_EDITMSG', 'feat(myapp): add feature');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should parse namespace>scope format', async () => {
      repo.addTextFile('apps/myapp/auth.ts', 'export const auth = true;', { stage: true });

      const I = await Cliete.openTerminal('commitional lint .git/COMMIT_EDITMSG');
      repo.addFile('COMMIT_EDITMSG', 'feat(myapp>auth): add login');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });
  });
});
