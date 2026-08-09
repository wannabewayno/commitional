import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

interface AddFileOpts {
  stage?: boolean;
}

export default class TestGitRepo {
  public readonly tempDir: string;
  public remoteDir?: string;
  private commitHashes: string[] = [];

  // Registry of every temp dir created across all instances, so a single
  // process-level exit handler can guarantee cleanup even when a test forgets
  // to call teardown().
  private static tempDirRegistry = new Set<string>();
  private static exitHandlerRegistered = false;

  private static registerExitHandler(): void {
    if (TestGitRepo.exitHandlerRegistered) return;
    TestGitRepo.exitHandlerRegistered = true;

    process.once('exit', () => {
      for (const dir of TestGitRepo.tempDirRegistry) {
        try {
          // rmSync is synchronous, which is required inside an 'exit' handler.
          rmSync(dir, { recursive: true, force: true });
        } catch {
          // Never throw during cleanup.
        }
      }
      TestGitRepo.tempDirRegistry.clear();
    });
  }

  constructor() {
    // Create temp directory
    this.tempDir = mkdtempSync(path.join(tmpdir(), 'test-git-repo-'));
    TestGitRepo.tempDirRegistry.add(this.tempDir);
    TestGitRepo.registerExitHandler();

    // Initialize git repo
    execSync('git init --quiet', { cwd: this.tempDir });
    execSync('git config user.name "Test User"', { cwd: this.tempDir });
    execSync('git config user.email "test@example.com"', { cwd: this.tempDir });
  }

  addBareRemote(name = 'origin') {
    this.remoteDir = mkdtempSync(path.join(tmpdir(), 'test-git-remote-'));
    TestGitRepo.tempDirRegistry.add(this.remoteDir);

    execSync('git init --bare --quiet', { cwd: this.remoteDir });
    execSync(`git remote add "${name}" "${this.remoteDir}"`, { cwd: this.tempDir });

    return this;
  }

  setUpstream(remote = 'origin') {
    const branch = execSync('git branch --show-current', { cwd: this.tempDir }).toString().trim();
    execSync(`git push -u "${remote}" "${branch}"`, { cwd: this.tempDir });

    return this;
  }

  get commits() {
    return execSync('git rev-list --all', { cwd: this.tempDir }).toString().trim().split('\n').filter(Boolean);
  }

  get remoteCommits() {
    if (!this.remoteDir) return [];

    return execSync(`git --git-dir="${this.remoteDir}" rev-list --all`, { cwd: this.tempDir })
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
  }

  get lastCommit() {
    return execSync('git rev-parse HEAD', { cwd: this.tempDir }).toString().trim();
  }

  addFile(name: string, content: string, opts: AddFileOpts = {}) {
    const filePath = path.join(this.tempDir, name);
    const dir = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (dir !== this.tempDir) mkdirSync(dir, { recursive: true });

    writeFileSync(filePath, content);

    if (opts.stage) this.stage(name);

    return this;
  }

  addDir(name: string) {
    const dirName = path.join(this.tempDir, name);
    mkdirSync(dirName, { recursive: true });

    return this;
  }

  stage(name: string) {
    execSync(`git add "${name}"`, { cwd: this.tempDir });
    return this;
  }

  stageAll() {
    execSync('git add .', { cwd: this.tempDir });
    return this;
  }

  commit(message: string, ...filesToCommit: string[]): string {
    // If specific files provided, add only those
    if (filesToCommit.length > 0) filesToCommit.forEach(file => this.stage(file));
    else this.stageAll();

    execSync(`git commit -m "${message}"`, { cwd: this.tempDir });

    // Get and store commit hash
    const hash = execSync('git rev-parse HEAD', { cwd: this.tempDir }).toString().trim();
    this.commitHashes.push(hash);

    return hash;
  }

  commitAll(message: string): string {
    return this.commit(message);
  }

  // Convenience methods for common file types
  addTextFile(name: string, content: string, opts?: AddFileOpts) {
    return this.addFile(`${name}.txt`, content, opts);
  }

  addTsFile(name: string, content: string, opts?: AddFileOpts) {
    return this.addFile(`${name}.ts`, content, opts);
  }

  addJsFile(name: string, content: string, opts?: AddFileOpts) {
    return this.addFile(`${name}.js`, content, opts);
  }

  // Hash retrieval methods
  getCommitHash(index = -1): string {
    const actualIndex = index < 0 ? this.commitHashes.length + index : index;
    const hash = this.commitHashes[actualIndex];
    if (hash === undefined) {
      throw new Error(`TestGitRepo: no commit hash at index ${index} (have ${this.commitHashes.length} commits)`);
    }
    return hash;
  }

  getShortHash(index = -1): string {
    return this.getCommitHash(index).substring(0, 7);
  }

  getAllHashes(): string[] {
    return [...this.commitHashes];
  }

  // Bulk operations
  addMultipleFiles(files: Record<string, string>): void {
    Object.entries(files).forEach(([name, content]) => {
      this.addFile(name, content);
    });
  }

  createDummyCommits(count: number, prefix = 'file'): string[] {
    const hashes: string[] = [];

    for (let i = 1; i <= count; i++) {
      this.addTextFile(`${prefix}${i}`, `Content for ${prefix} ${i}`);
      const hash = this.commit(`feat: add ${prefix}${i}`);
      hashes.push(hash);
    }

    return hashes;
  }

  removeFile(name: string) {
    const filePath = path.join(this.tempDir, name);
    unlinkSync(filePath);
    return this;
  }

  getFileContents(filename: string): string {
    const filePath = path.join(this.tempDir, filename);
    return readFileSync(filePath, 'utf-8');
  }

  teardown(): void {
    rmSync(this.tempDir, { recursive: true, force: true });
    TestGitRepo.tempDirRegistry.delete(this.tempDir);

    if (this.remoteDir) {
      rmSync(this.remoteDir, { recursive: true, force: true });
      TestGitRepo.tempDirRegistry.delete(this.remoteDir);
    }
  }
}
