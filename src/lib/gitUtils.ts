import { simpleGit } from "simple-git";

// Initialize simple-git instance with current working directory
function getGit() {
  // Remove the console.log that was causing the error message
  try {
    return simpleGit({ baseDir: process.cwd() });
  } catch (error) {
    // Fallback to default behavior if cwd fails
    return simpleGit();
  }
}

/**
 * Interface for git commit result
 */
export interface GitCommitResult {
  success: boolean;
  commitHash?: string;
  error?: Error;
}

/**
 * Execute git commit with the provided message
 * @param message The commit message
 * @returns Promise<GitCommitResult> Object containing success status and optional commit hash or error
 */
export async function executeGitCommit(message: string): Promise<GitCommitResult> {
  try {
    const git = getGit();

    // Check if there are staged changes
    const status = await git.status();
    if (status.staged.length === 0) {
      return {
        success: false,
        error: new Error("No staged changes to commit"),
      };
    }

    // Perform the commit
    await git.commit(message); // Skip pre-commit hooks for testing

    // Get the commit hash from the latest commit
    const log = await git.log({ maxCount: 1 });
    const commitHash = log.latest?.hash;

    if (!commitHash) throw new Error("Failed to get commit hash after commit");

    return {
      success: true,
      commitHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error during commit"),
    };
  }
}

/**
 * Check if the current directory is inside a Git repository
 */
export async function isGitRepository(): Promise<boolean> {
  try {
    const git = getGit();
    const result = await git.checkIsRepo();
    return result;
  } catch (error) {
    return false;
  }
}

/**
 * Get a list of staged files
 */
export async function getStagedFiles(): Promise<string[]> {
  try {
    const git = getGit();
    const status = await git.status();
    return status.staged;
  } catch (error) {
    console.error("Error getting staged files:", error);
    return [];
  }
}

/**
 * Get the diff of staged changes
 */
export async function getStagedDiff(): Promise<string> {
  try {
    const git = getGit();
    const diff = await git.diff(["--cached"]);
    return diff;
  } catch (error) {
    console.error("Error getting staged diff:", error);
    return "";
  }
}
