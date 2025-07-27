import Cliete from 'cliete';
import TestGitRepo from './fixtures/TestGitRepo';
import CommitlintConfigBuilder from './fixtures/CommitlintConfigBuilder';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

describe('CLI E2E Tests', () => {
  describe('Basic CLI Functionality', () => {
    let tempDir: string;

    before(() => {
      tempDir = mkdtempSync(path.join(tmpdir(), 'commitional-test-'));

      Cliete.setDefaults({ cwd: tempDir, width: 200 });
    });

    after(async () => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    // find the version it will be what-ever is in the package.json
    it('should display version information', async () => {
      // "1.0.0" => 1.0.0
      const currentVersion = execSync('npm pkg get version').toString().trim().slice(1, -1);

      const I = await Cliete.openTerminal('commitional --version');

      await I.spot(currentVersion);
    });

    it('should display help information', async () => {
      const I = await Cliete.openTerminal('commitional --help');
      await I.spot('Usage: commitional [options] [command]');
      await I.spot('CLI tool for crafting, formatting and linting commit messages');
      await I.spot('Options:');
    });

    it('should show error when not in git repository', async () => {
      const I = await Cliete.openTerminal('commitional');

      await I.spot('Not a git repository');
    });

    it('should show error when no files are staged', async () => {
      const repo = new TestGitRepo();

      const I = await Cliete.openTerminal('commitional', { cwd: repo.tempDir });

      await I.spot('No files staged to commit');
    });

    it('should handle ctrl+c gracefully', async () => {
      const repo = new TestGitRepo();
      repo.addJsFile('test', 'console.log("test");', { stage: true });

      const I = await Cliete.openTerminal('commitional', { cwd: repo.tempDir });

      await I.wait.until.I.spot('? Select the type');
      await I.press.ctrlC.and.wait.for.the.process.to.exit.with.exit.code.zero;
      await I.spot('👋 bye!');
    });
  });

  describe('Interactive Commit Flow', () => {
    let repo: TestGitRepo;

    before(() => {
      repo = new TestGitRepo();
      new CommitlintConfigBuilder(repo).typeEnum(['custom', 'special', 'unique']).typeEmpty('never').commitAsYaml();

      // Ensure we have staged changes, otherwise the cli with short circuit.
      repo.addJsFile('test', 'console.log("test");', { stage: true });

      Cliete.setDefaults({
        width: 100,
        height: 30,
        cwd: repo.tempDir,
      });
    });

    after(() => {
      repo.teardown();
    });

    it('should show commit type selection', async () => {
      const I = await Cliete.openTerminal('commitional');

      await I.spot("Select the type of change that you're committing:");
      await I.spot('custom');
      await I.spot('special');
      await I.spot('unique');
    });

    it('should navigate through commit types', async () => {
      const I = await Cliete.openTerminal('commitional');

      await I.spot('❯ custom');

      await I.press.down.twice.and.wait.until.I.spot('❯ unique');

      await I.press.up.once.and.wait.until.I.spot('❯ special');
    });
  });

  describe('Command Line Options', () => {
    let repo: TestGitRepo;

    before(() => {
      repo = new TestGitRepo();
      new CommitlintConfigBuilder(repo).typeEnum(['custom', 'special', 'unique']).typeEmpty('never').commitAsYaml();

      // Ensure we have staged changes, otherwise the cli with short circuit.
      repo.addJsFile('test', 'console.log("test");', { stage: true });

      Cliete.setDefaults({
        width: 100,
        height: 30,
        cwd: repo.tempDir,
      });
    });

    after(() => {
      repo.teardown();
    });

    it('should accept pre-filled type option', async () => {
      const I = await Cliete.openTerminal('commitional --type custom');

      await I.wait.until.I.spot('? Does this change introduce any breaking changes');

      await I.type('n').and.press.enter.and.wait.until.I.spot('custom:');
      await I.spot('? Commit or Edit');
    });

    it('should handle breaking change flag', async () => {
      const I = await Cliete.openTerminal(`commitional --type custom --subject 'breaking change' --breaking`);

      await I.spot('? Describe the breaking change:');
      await I.type('It breaks stuff').and.press.enter.and.wait.until.I.spot('custom!: breaking change ⚠️');
    });

    it('should handle no-breaking change flag', async () => {
      const I = await Cliete.openTerminal(`commitional --type custom --subject 'no breaking change' --no-breaking`);

      await I.spot('custom: no breaking change');
    });
  });
});
