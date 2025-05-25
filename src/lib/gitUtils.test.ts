import { describe, it } from "mocha";
import { strict as assert } from "node:assert";
import { isGitRepository, getStagedFiles, getStagedDiff, executeGitCommit } from "./gitUtils.js";
import { type SimpleGit, simpleGit } from "simple-git";
import fs from "node:fs";
import path from "node:path";

describe("Git Utilities", () => {
  describe("isGitRepository", () => {
    it("should detect if current directory is a git repository", async () => {
      const result = await isGitRepository();
      // Since we're running tests in the project directory, it should be a git repo
      assert.equal(result, true);
    });
  });

  describe("getStagedFiles", () => {
    it("should return an array of staged files", async () => {
      const files = await getStagedFiles();
      assert(Array.isArray(files));
    });
  });

  describe("getStagedDiff", () => {
    it("should return staged changes diff", async () => {
      const diff = await getStagedDiff();
      assert(typeof diff === "string");
    });
  });
});

describe("Git Commit Tests", () => {
  let git: SimpleGit;
  const testDir = path.join(process.cwd(), "test-repo");

  beforeEach(async () => {
    // Create test directory and initialize git
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);

    git = simpleGit();
    await git.init();

    // Configure git for tests
    await git.addConfig("user.name", "Test User", false, "local");
    await git.addConfig("user.email", "test@example.com", false, "local");

    // Create initial commit to establish HEAD
    fs.writeFileSync(path.join(testDir, "init.txt"), "initial commit");
    await git.add("init.txt");
    await git.commit("initial commit");
  });

  it("should fail to commit when there are no staged changes", async () => {
    const result = await executeGitCommit("test: empty commit");
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.message.includes("No staged changes to commit"));
  });

  it("should successfully create a commit with staged changes", async () => {
    // Create and stage a test file
    fs.writeFileSync(path.join(testDir, "test.txt"), "test content");
    await git.add("test.txt");

    const result = await executeGitCommit("test: add test file");
    assert.strictEqual(result.success, true);
    assert.ok(result.commitHash);

    // Verify the commit exists
    const log = await git.log({ maxCount: 1 });
    assert.strictEqual(log.latest?.message, "test: add test file");
  });

  afterEach(async () => {
    // Clean up test directory
    process.chdir(process.cwd());
    fs.rmSync(testDir, { recursive: true, force: true });
  });
});
