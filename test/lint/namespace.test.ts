import TestGitRepo from '../fixtures/TestGitRepo.js';
import CommitlintConfigBuilder from '../fixtures/CommitlintConfigBuilder.js';
import Cliete from 'cliete';
import testHook from '../fixtures/testHook.js';

function initializeRepoHooks() {
  return testHook(() => {
    const repo = new TestGitRepo();
    repo.addDir('libs/shared').addDir('apps/myapp').addDir('libs/tools');
    new CommitlintConfigBuilder(repo).namespaceEnum(['apps/*', 'libs/*']).commitAsYaml();

    Cliete.setDefault('cwd', repo.tempDir);
    Cliete.setDefault('width', 120);
    Cliete.setDefault('height', 60);
    Cliete.setDefault('timeout', null);

    return [{ repo }, () => repo.teardown()];
  });
}

interface ValidTestCase {
  title: string;
  changes: string[];
  commitMessage: string;
}

interface InvalidTestCase extends ValidTestCase {
  error: string[];
}

const VALID: ValidTestCase[] = [
  {
    title: 'should accept commit with namespace only',
    changes: ['apps/myapp/feature'],
    commitMessage: '[myapp] feat: add new feature',
  },
  {
    title: 'should accept commit with namespace and scope',
    changes: ['apps/myapp/auth'],
    commitMessage: '[myapp] feat(auth): add login system',
  },
  {
    title: 'should accept commit with libs namespace',
    changes: ['libs/shared/utils'],
    commitMessage: '[shared] feat: add utility functions',
  },
  {
    title: 'should accept root files without namespace',
    changes: ['README.md'],
    commitMessage: 'docs: update readme',
  },
];

const INVALID: InvalidTestCase[] = [
  {
    title: 'should reject commit missing namespace for namespaced files',
    changes: ['apps/myapp/feature.ts'],
    commitMessage: 'feat: add new feature',
    error: ['- Files in apps/myapp require namespace "myapp"'],
  },
  {
    title: 'should reject namespaced commit for root files',
    changes: ['README.txt'],
    commitMessage: '[myapp] feat: add new feature',
    error: ['- Files not apart of namespace "myapp"'],
  },
  {
    title: 'should reject commit with wrong namespace',
    changes: ['apps/myapp/feature.ts'],
    commitMessage: '[tools] feat: add new feature',
    error: ['- Files in apps/myapp require namespace "myapp", got "tools"'],
  },
  {
    title: 'should reject commit spanning multiple namespaces',
    changes: ['apps/myapp/feature.ts', 'libs/shared/utils.ts'],
    commitMessage: '[myapp] feat: add feature and utils',
    error: ['- Commit spans multiple namespaces: myapp, shared'],
  },
  {
    title: 'should reject invalid namespace not in enum',
    changes: ['apps/myapp/feature.ts'],
    commitMessage: '[invalidns] feat: add new feature',
    error: [
      "- The namespace can only be one of: 'myapp', 'shared' or 'tools'",
      '- Files in apps/myapp require namespace "myapp", got "invalidns"',
    ],
  },
];

describe('Namespace E2E Tests', () => {
  describe('Valid Namespace Commits - Staged', () => {
    const ctx = initializeRepoHooks();

    VALID.forEach(({ changes, commitMessage, title }) => {
      it(title, async () => {
        changes.forEach(change => ctx.repo.addTsFile(change, 'export const feature = true;', { stage: true }));

        ctx.repo.addTextFile('commit_message', commitMessage);
        const I = await Cliete.openTerminal('commitional lint commit_message.txt');

        await I.wait.for.the.process.to.exit.with.exit.code.zero;
        await I.see('');
      });
    });
  });

  describe('Valid Namespace Commits - Historical', () => {
    const ctx = initializeRepoHooks();

    VALID.forEach(({ changes, commitMessage, title }) => {
      it(title, async () => {
        // Make Changes
        changes.forEach(change => ctx.repo.addTsFile(change, 'export const feature = true;'));

        // Commit the changes
        const hash = ctx.repo.commit(commitMessage);

        // Lint the hash
        const I = await Cliete.openTerminal(`commitional lint ${hash}`);

        await I.wait.for.the.process.to.exit.with.exit.code.zero;
        await I.see('');
      });
    });
  });

  describe('Invalid Namespace Commits - Staged', () => {
    const ctx = initializeRepoHooks();

    INVALID.forEach(({ changes, commitMessage, error, title }) => {
      it(title, async () => {
        changes.forEach(change => ctx.repo.addFile(change, 'content', { stage: true }));

        ctx.repo.addTextFile('commit_message', commitMessage);
        const I = await Cliete.openTerminal('commitional lint commit_message.txt');

        await I.wait.until.I.see('---', commitMessage, '', '[namespace]', error.join('\n'), '');

        await I.wait.until.the.process.exits.with.nonZero.exit.code;
      });
    });
  });

  describe('Invalid Namespace Commits - Historical', () => {
    const ctx = initializeRepoHooks();

    INVALID.forEach(({ changes, commitMessage, error, title }) => {
      it(title, async () => {
        // Make Changes
        changes.forEach(change => ctx.repo.addTsFile(change, 'export const feature = true;'));

        // Commit the changes
        const hash = ctx.repo.commit(commitMessage);

        // Lint the hash
        const I = await Cliete.openTerminal(`commitional lint ${hash}`);

        await I.wait.until.I.see('---', commitMessage, '', '[namespace]', error.join('\n'), '');

        await I.wait.until.the.process.exits.with.nonZero.exit.code;
      });
    });
  });

  describe('Namespace Parsing', () => {
    const ctx = testHook(() => {
      const repo = new TestGitRepo();

      Cliete.setDefault('cwd', repo.tempDir);
      Cliete.setDefault('width', 120);
      Cliete.setDefault('height', 60);
      Cliete.setDefault('timeout', null);

      return [{ repo }, () => repo.teardown()];
    });

    it('should parse namespace only format', async () => {
      ctx.repo.addTextFile('commit_message', '[myapp] feat: Add feature');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should parse namespace with scope format', async () => {
      ctx.repo.addTextFile('commit_message', '[myapp] feat(auth): Add login');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });

    it('should parse traditional scope format (backward compatibility)', async () => {
      ctx.repo.addTextFile('commit_message', 'feat(auth): Add feature');
      const I = await Cliete.openTerminal('commitional lint commit_message.txt');

      await I.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.see('');
    });
  });
});
