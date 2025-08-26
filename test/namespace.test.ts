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
      new CommitlintConfigBuilder(repo).namespaceEnum(['apps/*', 'libs/*']).commitAsYaml();
    });

    it('should accept commit with namespace only', async () => {
      repo.addTsFile('apps/myapp/feature', 'export const feature = true;', { stage: true });

      repo.addTextFile('commit_message', '[myapp] feat: add new feature');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should accept commit with namespace and scope', async () => {
      repo.addTsFile('apps/myapp/auth', 'export const auth = true;', { stage: true });

      repo.addTextFile('commit_message', '[myapp] feat(auth): add login system');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should accept commit with libs namespace', async () => {
      repo.addTsFile('libs/shared/utils', 'export const utils = true;', { stage: true });

      repo.addTextFile('commit_message', '[shared] feat: add utility functions');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should accept root files without namespace', async () => {
      repo.addFile('README.md', '# Project', { stage: true });

      repo.addTextFile('commit_message', 'docs: update readme');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });
  });

  describe('Invalid Namespace Commits', () => {
    beforeEach(() => {
      new CommitlintConfigBuilder(repo).namespaceEnum(['apps/*', 'libs/*']).commitAsYaml();
    });

    it('should reject commit missing namespace for namespaced files', async () => {
      repo.addTsFile('apps/myapp/feature', 'export const feature = true;', { stage: true });

      repo.addFile('commit_message', 'feat: add new feature');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

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

    it('should reject namespaced commit for root files', async () => {
      repo.addFile('README.txt', 'export const feature = true;', { stage: true });

      repo.addFile('commit_message', '[myapp] feat: add new feature');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.until.I.see(
        '---',
        '[myapp] feat: add new feature',
        '',
        '[namespace]',
        '- Files not apart of namespace "myapp"',
        '',
      );

      await I.wait.until.the.process.exits.with.nonZero.exit.code;
    });

    it('should reject commit with wrong namespace', async () => {
      repo.addTsFile('apps/myapp/feature', 'export const feature = true;', { stage: true });

      repo.addFile('commit_message', '[otherapp] feat: add new feature');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.until.I.see(
        '---',
        '[otherapp] feat: add new feature',
        '',
        '[namespace]',
        '- Files in apps/myapp require namespace "myapp", got "otherapp"',
        '',
      );

      await I.wait.until.the.process.exits.with.nonZero.exit.code;
    });

    it('should reject commit spanning multiple namespaces', async () => {
      repo.addTsFile('apps/myapp/feature', 'export const feature = true;', { stage: true });
      repo.addTsFile('libs/shared/utils', 'export const utils = true;', { stage: true });

      repo.addTextFile('commit_message', '[myapp] feat: add feature and utils');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.until.I.see(
        '---',
        '[myapp] feat: add feature and utils',
        '',
        '[namespace]',
        '- Commit spans multiple namespaces: myapp, shared',
        '',
      );

      await I.wait.until.the.process.exits.with.nonZero.exit.code;
    });

    it('should reject invalid namespace not in enum', async () => {
      repo.addTsFile('apps/myapp/feature', 'export const feature = true;', { stage: true });

      repo.addTextFile('commit_message', '[invalidns] feat: add new feature');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.until.I.see(
        '---',
        '[invalidns] feat: add new feature',
        '',
        '[namespace]',
        '- Namespace must be one of: myapp, shared',
        '',
      );

      await I.wait.until.the.process.exits.with.nonZero.exit.code;
    });
  });

  describe('Namespace Parsing', () => {
    beforeEach(() => {
      new CommitlintConfigBuilder(repo).namespaceEnum(['apps/*']).commitAsYaml();
    });

    it('should parse namespace only format', async () => {
      repo.addTsFile('apps/myapp/feature', 'export const feature = true;', { stage: true });

      repo.addFile('commit_message', '[myapp] feat: add feature');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should parse namespace with scope format', async () => {
      repo.addTsFile('apps/myapp/auth', 'export const auth = true;', { stage: true });

      repo.addTextFile('commit_message', '[myapp] feat(auth): add login');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should parse traditional scope format (backward compatibility)', async () => {
      repo.addTsFile('apps/myapp/feature', 'export const feature = true;', { stage: true });

      repo.addFile('commit_message', 'feat(auth): add feature');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });
  });
});
