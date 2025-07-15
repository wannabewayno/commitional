import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import Cliete from 'cliete';
import TestGitRepo from './fixtures/TestGitRepo';
import CommitlintConfigBuilder from './fixtures/CommitlintConfigBuilder';

describe('CLI E2E Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'commitional-test-'));
  });

  afterEach(async () => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Basic CLI Functionality', () => {
    // find the version it will be what-ever is in the package.json
    it('should display version information', async () => {
      const I = await Cliete.openTerminal('commitional --version', {
        width: 80,
        height: 24,
        cwd: tempDir,
      });

      await I.spot('1.0.0');
    });

    it('should display help information', async () => {
      const I = await Cliete.openTerminal('commitional --help', {
        width: 120,
        height: 24,
        cwd: tempDir,
      });
      await I.spot('Usage: commitional [options] [command]');
      await I.spot('CLI tool for crafting commit messages');
      await I.spot('Options:');
    });

    it('should show error when not in git repository', async () => {
      const I = await Cliete.openTerminal('commitional', {
        width: 100,
        height: 24,
        cwd: tempDir,
      });

      await I.spot('Not a git repository');
    });

    it('should show error when no files are staged', async () => {
      const repo = new TestGitRepo();

      const I = await Cliete.openTerminal('commitional', {
        width: 80,
        height: 24,
        cwd: repo.tempDir,
      });

      await I.spot('No files staged to commit');
    });

    it('should handle ctrl+c gracefully', async () => {
      const repo = new TestGitRepo();
      repo.addJsFile('test', 'console.log("test");', { stage: true });

      const I = await Cliete.openTerminal('commitional', {
        width: 80,
        height: 24,
        cwd: repo.tempDir,
      });

      await I.wait.until.I.spot('? Select the type');
      await I.press.ctrlC.and.wait.for.the.process.to.exit();
      await I.spot('👋 bye!');
    });
  });

  describe('Interactive Commit Flow', () => {
    let repo: TestGitRepo;

    before(() => {
      repo = new TestGitRepo();
      repo.addJsFile('test', 'console.log("test");', { stage: true });
    });

    after(() => {
      repo.teardown();
    });

    it('should show commit type selection', async () => {
      const I = await Cliete.openTerminal('commitional', {
        width: 100,
        height: 30,
        cwd: repo.tempDir,
      });

      await I.spot("Select the type of change that you're committing:");
      await I.spot('feat');
      await I.spot('fix');
      await I.spot('docs');
    });

    it('should navigate through commit types', async () => {
      const I = await Cliete.openTerminal('commitional', {
        width: 100,
        height: 30,
        cwd: repo.tempDir,
      });

      await I.spot('❯ feat');

      await I.press.down.twice.and.wait.until.I.spot('❯ docs');

      await I.press.up.once.and.wait.until.I.spot('❯ fix');
    });
  });

  describe('Command Line Options', () => {
    let repo: TestGitRepo;

    before(() => {
      repo = new TestGitRepo();
      repo.addJsFile('test', 'console.log("test");', { stage: true });
    });

    after(() => {
      repo.teardown();
    });

    it('should accept pre-filled type option', async () => {
      const I = await Cliete.openTerminal('commitional --type feat', {
        width: 100,
        height: 30,
        cwd: repo.tempDir,
      });

      await I.wait.until.I.spot('? Subject');
    });

    it('should handle breaking change flag', async () => {
      const I = await Cliete.openTerminal(`commitional --type feat --subject 'breaking change' --breaking`, {
        width: 100,
        height: 30,
        cwd: repo.tempDir,
      });

      await I.spot('feat!: breaking change ⚠️');
    });
  });

  describe('Configuration Integration', () => {
    let repo: TestGitRepo;

    before(() => {
      repo = new TestGitRepo();
      // Commit a configuration file
      new CommitlintConfigBuilder(repo).typeEnum(['custom', 'special', 'unique']).commitAsYaml();

      // Stage a file for addition
      repo.addJsFile('test', 'console.log("test");', { stage: true });
    });

    after(() => {
      repo.teardown();
    });

    it('should use custom commit types from config', async () => {
      const I = await Cliete.openTerminal('commitional', {
        width: 100,
        height: 30,
        cwd: repo.tempDir,
      });

      await I.spot('? Select the type');
      await I.spot('custom');
      await I.spot('special');
      await I.spot('unique');
    });
  });
});
