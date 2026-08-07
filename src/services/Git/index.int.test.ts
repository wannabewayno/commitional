import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { type SimpleGit, simpleGit } from 'simple-git';
import Diff from './Diff.js';
import Git from './index.js';

describe('Git Utilities', () => {
  let git: Git;

  before(() => {
    git = new Git();
  });

  describe('isGitRepository', () => {
    it('should detect if current directory is a git repository', async () => {
      const result = await git.isRepository();
      // Since we're running tests in the project directory, it should be a git repo
      assert.equal(result, true);
    });
  });

  describe('getStagedFiles', () => {
    it('should return an array of staged files', async () => {
      const files = await git.stagedFiles();
      assert(Array.isArray(files));
    });
  });

  describe('getStagedDiff', () => {
    it('should return staged changes diff', async () => {
      const diff = await git.stagedDiff();
      expect(diff).to.be.an.instanceOf(Diff);
    });
  });
});

describe('Git Commit Tests', () => {
  let gitService: Git;
  let git: SimpleGit;
  const testDir = path.join(process.cwd(), 'test-repo');

  let cleanup: () => void;

  beforeEach(async () => {
    // Create test directory and initialize git
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);

    gitService = new Git();

    git = simpleGit();
    await git.init();

    // Configure git for tests
    await git.addConfig('user.name', 'Test User', false, 'local');
    await git.addConfig('user.email', 'test@example.com', false, 'local');

    // Create initial commit to establish HEAD
    fs.writeFileSync(path.join(testDir, 'init.txt'), 'initial commit');
    await git.add('init.txt');
    await git.commit('initial commit');

    cleanup = () => {
      process.chdir(process.cwd());
      fs.rmSync(testDir, { recursive: true, force: true });
    };
  });

  it('should fail to commit when there are no staged changes', async () => {
    const result = await gitService.commit('test: empty commit');
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.message.includes('No staged changes to commit'));
  });

  it('should successfully create a commit with staged changes', async () => {
    // Create and stage a test file
    fs.writeFileSync(path.join(testDir, 'test.txt'), 'test content');
    await git.add('test.txt');

    const result = await gitService.commit('test: add test file');
    assert.strictEqual(result.success, true);
    assert.ok(result.commitHash);

    // Verify the commit exists
    const log = await git.log({ maxCount: 1 });
    assert.strictEqual(log.latest?.message, 'test: add test file');
  });

  afterEach(() => cleanup());
});

describe('GitCommit Integration Tests', () => {
  let gitService: Git;
  let git: SimpleGit;
  const testDir = path.join(process.cwd(), 'test-gitcommit');

  let cleanup: () => void;

  beforeEach(async () => {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);

    gitService = new Git();
    git = simpleGit();
    await git.init();
    await git.addConfig('user.name', 'Test User', false, 'local');
    await git.addConfig('user.email', 'test@example.com', false, 'local');

    cleanup = () => {
      process.chdir(process.cwd());
      fs.rmSync(testDir, { recursive: true, force: true });
    };
  });

  it('should create staged commit with files', async () => {
    fs.writeFileSync('test.ts', 'test content');
    await git.add('test.ts');

    const stagedCommit = await gitService.stagedCommit();
    expect(stagedCommit.files).to.include('test.ts');
    expect(stagedCommit.isStaged).to.be.true;
    expect(stagedCommit.hash).to.equal('');
  });

  it('should get commit with files from hash', async () => {
    fs.writeFileSync('feature.ts', 'feature content');
    await git.add('feature.ts');
    const result = await git.commit('feat: add feature');

    const gitCommit = await gitService.getCommit(result.commit);
    expect(gitCommit.files).to.include('feature.ts');
    expect(gitCommit.isStaged).to.be.false;
    expect(gitCommit.hash).to.equal(result.commit);
  });

  afterEach(() => cleanup());
});

describe('Git Push Integration Tests', () => {
  const originalCwd = process.cwd();
  let gitService: Git;
  let git: SimpleGit;
  let testDir: string;
  let remoteDir: string | undefined;

  beforeEach(async () => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'commitional-git-push-'));
    process.chdir(testDir);

    git = simpleGit();
    await git.init();
    await git.addConfig('user.name', 'Test User', false, 'local');
    await git.addConfig('user.email', 'test@example.com', false, 'local');
    gitService = new Git();
  });

  async function createCommit(fileName: string, message: string): Promise<string> {
    fs.writeFileSync(path.join(testDir, fileName), message);
    await git.add(fileName);

    const result = await gitService.commit(message);
    assert.strictEqual(result.success, true);
    assert.ok(result.commitHash);
    return result.commitHash;
  }

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true, force: true });
    if (remoteDir) fs.rmSync(remoteDir, { recursive: true, force: true });
    remoteDir = undefined;
  });

  it('should push the current branch to its configured bare remote', async () => {
    await createCommit('initial.txt', 'initial commit');

    remoteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'commitional-git-remote-'));
    const remoteGit = simpleGit(remoteDir);
    await remoteGit.init(true);
    await git.addRemote('origin', remoteDir);

    const branch = (await git.status()).current;
    assert.ok(branch);
    await git.push(['--set-upstream', 'origin', branch]);

    const commitHash = await createCommit('change.txt', 'test: push commit');
    const result = await gitService.push();

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.branch, branch);
    assert.strictEqual(result.remote, 'origin');

    const remoteLog = await remoteGit.log({ maxCount: 1 });
    assert.strictEqual(remoteLog.latest?.hash, commitHash);
  });

  it('should return a structured no-remote failure while retaining the local commit', async () => {
    const commitHash = await createCommit('change.txt', 'test: no remote');

    const result = await gitService.push();
    assert.strictEqual(result.success, false);
    assert.match(result.error?.message ?? '', /no remote is configured/i);

    const localLog = await git.log({ maxCount: 1 });
    assert.strictEqual(localLog.latest?.hash, commitHash);
  });

  it('should return a structured push failure while retaining the local commit', async () => {
    const unreachableRemote = path.join(testDir, 'missing-remote.git');
    await git.addRemote('origin', unreachableRemote);
    const commitHash = await createCommit('change.txt', 'test: unreachable remote');

    const result = await gitService.push();
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
    assert.match(result.error.message, /remote|repository|connect|push/i);

    const localLog = await git.log({ maxCount: 1 });
    assert.strictEqual(localLog.latest?.hash, commitHash);
  });
});
