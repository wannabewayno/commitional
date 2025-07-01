import path from 'node:path';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import Cliete from 'cliete';


// Helper function to create a git repository with staged files
function setupGitRepo(tempDir: string, files: Record<string, string> = {}) {
  // Initialize git repo
  execSync('git init', { cwd: tempDir });
  execSync('git config user.name "Test User"', { cwd: tempDir });
  execSync('git config user.email "test@example.com"', { cwd: tempDir });
  
  // Create and stage files
  Object.entries(files).forEach(([filename, content]) => {
    const filePath = path.join(tempDir, filename);
    const dir = path.dirname(filePath);
    if (dir !== tempDir) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, content);
    execSync(`git add "${filename}"`, { cwd: tempDir });
  });
}

// Helper function to create commitlint config
function createCommitlintConfig(tempDir: string, config: any) {
  writeFileSync(
    path.join(tempDir, 'commitlint.config.js'),
    `module.exports = ${JSON.stringify(config, null, 2)};`
  );
}

describe('CLI E2E Tests', () => {
  let tempDir: string;
  let I: Cliete;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'commitional-test-'));
  });

  afterEach(async () => {
    // if (I) {
      // await I.close();
    // }
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Basic CLI Functionality', () => {
    it('should display version information', async () => {
      I = await Cliete.openTerminal('commitional --version', {
        width: 80,
        height: 24,
        // cwd: tempDir
      });

      await I.spot('dev');
    });

    it('should display help information', async () => {
      I = await Cliete.openTerminal('commitional --help', {
        width: 80,
        height: 24,
        // cwd: tempDir
      });

      await I.spot('Usage: commitional [options]');
      await I.spot('CLI tool for crafting commit messages');
      await I.spot('Options:');
    });

    it('should show error when not in git repository', async () => {
      I = await Cliete.openTerminal('commitional', {
        width: 80,
        height: 24,
        // cwd: tempDir
      });

      await I.spot('Not a git repository');
    });

    it('should show error when no files are staged', async () => {
      setupGitRepo(tempDir);
      
      I = await Cliete.openTerminal('commitional', {
        width: 80,
        height: 24,
        // cwd: tempDir
      });

      await I.spot('No files staged to commit');
    });
  });

  describe('Interactive Commit Flow', () => {
    beforeEach(() => {
      setupGitRepo(tempDir, { 'test.js': 'console.log("test");' });
    });

    it('should show commit type selection', async () => {
      I = await Cliete.openTerminal('commitional', {
        width: 100,
        height: 30,
        // cwd: tempDir
      });

      await I.spot("Select the type of change that you're committing:");
      await I.spot('feat');
      await I.spot('fix');
      await I.spot('docs');
    });

    it('should navigate through commit types', async () => {
      I = await Cliete.openTerminal('commitional', {
        width: 100,
        height: 30,
        // cwd: tempDir
      });

      await I.spot('❯ feat');
      
      await I.press.down.twice.and.spot('❯ docs');
      
      await I.press.up.once.and.spot('❯ fix');
    });
  });

  describe('Command Line Options', () => {
    beforeEach(() => {
      setupGitRepo(tempDir, { 'test.js': 'console.log("test");' });
    });

    it('should accept pre-filled type option', async () => {
      I = await Cliete.openTerminal('commitional --type feat', {
        width: 100,
        height: 30,
        // cwd: tempDir
      });

      await I.spot('Subject');
    });

    it('should handle breaking change flag', async () => {
      I = await Cliete.openTerminal(`commitional --type feat --subject 'breaking change' --breaking`, {
        width: 100,
        height: 30,
        // cwd: tempDir
      });

      await I.spot('feat!: breaking change');
    });
  });

  describe('Configuration Integration', () => {
    it('should use custom commit types from config', async () => {
      setupGitRepo(tempDir, { 'test.js': 'console.log("test");' });
      
      const config = {
        rules: {
          'type-enum': [2, 'always', ['custom', 'special', 'unique']]
        }
      };
      createCommitlintConfig(tempDir, config);

      I = await Cliete.openTerminal('commitional', {
        width: 100,
        height: 30,
        // cwd: tempDir
      });

      await I.spot('custom');
      await I.spot('special');
      await I.spot('unique');
    });
  });
});