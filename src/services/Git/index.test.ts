import { describe, it } from "mocha";
import { strict as assert } from "node:assert";
import Git from "./index.js";
import { type SimpleGit, simpleGit } from "simple-git";
import fs from "node:fs";
import path from "node:path";

describe("Git Utilities", () => {
  let git: Git;

  before(() => {
    git = new Git()
  });

  describe("isGitRepository", () => {
    it("should detect if current directory is a git repository", async () => {
      const result = await git.isRepository();
      // Since we're running tests in the project directory, it should be a git repo
      assert.equal(result, true);
    });
  });

  describe("getStagedFiles", () => {
    it("should return an array of staged files", async () => {
      const files = await git.stagedFiles();
      assert(Array.isArray(files));
    });
  });

  describe("getStagedDiff", () => {
    it("should return staged changes diff", async () => {
      const diff = await git.stagedDiff();
      assert(typeof diff === "string");
    });
  });
});

describe("Git Commit Tests", () => {
  let git: Git;
  let _git: SimpleGit;
  const testDir = path.join(process.cwd(), "test-repo");

  before(() => git = new Git())

  beforeEach(async () => {
    // Create test directory and initialize git
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);

    _git = simpleGit();
    await _git.init();

    // Configure git for tests
    await _git.addConfig("user.name", "Test User", false, "local");
    await _git.addConfig("user.email", "test@example.com", false, "local");

    // Create initial commit to establish HEAD
    fs.writeFileSync(path.join(testDir, "init.txt"), "initial commit");
    await _git.add("init.txt");
    await _git.commit("initial commit");
  });

  it("should fail to commit when there are no staged changes", async () => {
    const result = await git.commit("test: empty commit");
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.message.includes("No staged changes to commit"));
  });

  it("should successfully create a commit with staged changes", async () => {
    // Create and stage a test file
    fs.writeFileSync(path.join(testDir, "test.txt"), "test content");
    await _git.add("test.txt");

    const result = await git.commit("test: add test file");
    assert.strictEqual(result.success, true);
    assert.ok(result.commitHash);

    // Verify the commit exists
    const log = await _git.log({ maxCount: 1 });
    assert.strictEqual(log.latest?.message, "test: add test file");
  });

  afterEach(async () => {
    // Clean up test directory
    process.chdir(process.cwd());
    fs.rmSync(testDir, { recursive: true, force: true });
  });
});
