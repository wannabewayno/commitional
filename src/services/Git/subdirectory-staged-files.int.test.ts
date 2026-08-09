import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'mocha';
import TestGitRepo from '../../../test/fixtures/TestGitRepo.js';
import type Diff from './Diff.js';
import Git from './index.js';

function requireDiff(result: Diff | Error): Diff {
  if (result instanceof Error) throw result;
  return result;
}

function assertPopulatedFileDiff(result: Diff | Error, filePath: string): Diff {
  const diff = requireDiff(result);

  assert.ok(diff.files.includes(filePath), `expected staged files to include ${filePath}`);
  assert.ok(diff.file(filePath)?.trim(), `expected a non-empty diff for ${filePath}`);

  return diff;
}

describe('Git staged diff from repository subdirectories', () => {
  const originalCwd = process.cwd();
  let repo: TestGitRepo | undefined;

  beforeEach(() => {
    repo = new TestGitRepo();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    repo?.teardown();
    repo = undefined;
  });

  it('returns a non-empty diff for a staged single file from a subdirectory', async () => {
    const testRepo = repo as TestGitRepo;
    testRepo.addFile('src/foo.ts', 'export const foo = true;\n', { stage: true });
    process.chdir(path.join(testRepo.tempDir, 'src'));

    const diff = await (await Git.create()).stagedDiff();

    assertPopulatedFileDiff(diff, 'src/foo.ts');
  });

  it('returns a non-empty diff for a staged nested file from a different subdirectory', async () => {
    const testRepo = repo as TestGitRepo;
    testRepo.addDir('docs');
    testRepo.addFile('src/services/Git/index.ts', 'export const gitService = true;\n', { stage: true });
    process.chdir(path.join(testRepo.tempDir, 'docs'));

    const diff = await (await Git.create()).stagedDiff();

    assertPopulatedFileDiff(diff, 'src/services/Git/index.ts');
  });

  it('returns the same staged files and per-file content from the root and a subdirectory', async () => {
    const testRepo = repo as TestGitRepo;
    testRepo.addDir('a');
    testRepo.addFile('src/foo.ts', 'export const foo = true;\n', { stage: true });
    testRepo.addFile('b/bar.ts', 'export const bar = true;\n', { stage: true });

    process.chdir(testRepo.tempDir);
    const rootDiff = requireDiff(await (await Git.create()).stagedDiff());

    process.chdir(path.join(testRepo.tempDir, 'a'));
    const subdirectoryDiff = requireDiff(await (await Git.create()).stagedDiff());

    assert.deepEqual(subdirectoryDiff.files, rootDiff.files);
    for (const filePath of rootDiff.files) {
      assert.equal(subdirectoryDiff.file(filePath), rootDiff.file(filePath));
    }
  });

  it('includes a staged change outside the current subdirectory', async () => {
    const testRepo = repo as TestGitRepo;
    testRepo.addDir('a');
    testRepo.addFile('b/outside.ts', 'export const outside = true;\n', { stage: true });
    process.chdir(path.join(testRepo.tempDir, 'a'));

    const diff = await (await Git.create()).stagedDiff();

    assertPopulatedFileDiff(diff, 'b/outside.ts');
  });
});

describe('Git staged diff preservation behavior', () => {
  const originalCwd = process.cwd();
  let repo: TestGitRepo | undefined;

  beforeEach(() => {
    repo = new TestGitRepo();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    repo?.teardown();
    repo = undefined;
  });

  it('preserves root-relative staged paths from the repository root', async () => {
    const testRepo = repo as TestGitRepo;
    testRepo
      .addFile('src/root.ts', 'export const root = true;\n', { stage: true })
      .addFile('docs/readme.md', '# Readme\n', { stage: true });
    process.chdir(testRepo.tempDir);

    const stagedFiles = await (await Git.create()).stagedFiles();

    assert.deepEqual([...stagedFiles].sort(), ['docs/readme.md', 'src/root.ts']);
  });

  it('preserves populated per-file staged diffs from the repository root', async () => {
    const testRepo = repo as TestGitRepo;
    testRepo.addFile('src/root.ts', 'export const root = true;\n', { stage: true });
    process.chdir(testRepo.tempDir);

    const diff = requireDiff(await (await Git.create()).stagedDiff());

    assert.deepEqual(diff.files, ['src/root.ts']);
    const rootDiff = diff.file('src/root.ts');
    assert.ok(rootDiff);
    const normalised = rootDiff.replace(/^index [0-9a-f]+\.\.[0-9a-f]+/m, 'index <hash>..<hash>');
    assert.equal(
      normalised,
      'diff --git a/src/root.ts b/src/root.ts\n' +
        'new file mode 100644\n' +
        'index <hash>..<hash>\n' +
        '--- /dev/null\n' +
        '+++ b/src/root.ts\n' +
        '@@ -0,0 +1 @@\n' +
        '+export const root = true;\n',
    );
  });

  it('preserves an empty staged diff from both the repository root and a subdirectory', async () => {
    const testRepo = repo as TestGitRepo;
    testRepo.addDir('src');

    process.chdir(testRepo.tempDir);
    const rootDiff = requireDiff(await (await Git.create()).stagedDiff());

    process.chdir(path.join(testRepo.tempDir, 'src'));
    const subdirectoryDiff = requireDiff(await (await Git.create()).stagedDiff());

    for (const diff of [rootDiff, subdirectoryDiff]) {
      assert.deepEqual(diff.files, []);
      assert.equal(diff.toString(), '');
    }
  });

  it('preserves graceful empty results outside a repository', async () => {
    const nonRepositoryDir = mkdtempSync(path.join(tmpdir(), 'commitional-git-non-repo-'));

    try {
      process.chdir(nonRepositoryDir);
      const git = await Git.create();
      const diff = requireDiff(await git.stagedDiff());

      assert.equal(await git.isRepository(), false);
      assert.deepEqual(await git.stagedFiles(), []);
      assert.deepEqual(diff.files, []);
      assert.equal(diff.toString(), '');
    } finally {
      rmSync(nonRepositoryDir, { recursive: true, force: true });
    }
  });
});
