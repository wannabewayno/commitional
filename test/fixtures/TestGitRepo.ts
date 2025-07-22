import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, unlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

interface AddFileOpts {
  stage?: boolean;
}

export default class TestGitRepo {
  public readonly tempDir: string;
  private commitHashes: string[] = [];

  constructor() {
    // Create temp directory
    this.tempDir = mkdtempSync(path.join(tmpdir(), 'test-git-repo-'));

    // Initialize git repo
    execSync('git init --quiet', { cwd: this.tempDir });
    execSync('git config user.name "Test User"', { cwd: this.tempDir });
    execSync('git config user.email "test@example.com"', { cwd: this.tempDir });
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
    return this.commitHashes[actualIndex];
  }

  getShortHash(index = -1): string {
    return this.getCommitHash(index)?.substring(0, 7);
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
  }
}
