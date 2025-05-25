import { simpleGit, type SimpleGit } from "simple-git";

/**
 * Interface for git commit result
 */
export interface GitCommitResult {
  success: boolean;
  commitHash?: string;
  error?: Error;
}

export default class Git {
  private git: SimpleGit;

  constructor() {
    try {
      this.git = simpleGit({ baseDir: process.cwd() });
    } catch (error) {
      // Fallback to default behavior if cwd fails
      this.git = simpleGit();
    }
  }

  /**
   * Execute git commit with the provided message
   * @param message The commit message
   * @returns Promise<GitCommitResult> Object containing success status and optional commit hash or error
   */
  async commit(message: string): Promise<GitCommitResult> {
    try {
      // Check if there are staged changes
      const status = await this.git.status();
      if (status.staged.length === 0) {
        return {
          success: false,
          error: new Error("No staged changes to commit"),
        };
      }

      // Perform the commit
      await this.git.commit(message);

      // Get the commit hash from the latest commit
      const log = await this.git.log({ maxCount: 1 });
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
  async isRepository(): Promise<boolean> {
    try {
      const result = await this.git.checkIsRepo();
      return result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a list of staged files
   */
  async stagedFiles(): Promise<string[]> {
    try {
      const status = await this.git.status();
      return status.staged;
    } catch (error) {
      console.error("Error getting staged files:", error);
      return [];
    }
  }

  /**
   * Get the diff of staged changes
   */
  async stagedDiff(): Promise<string> {
    try {
      const diff = await this.git.diff(["--cached"]);
      return diff;
    } catch (error) {
      console.error("Error getting staged diff:", error);
      return "";
    }
  }
}
