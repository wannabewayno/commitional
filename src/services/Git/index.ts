import { simpleGit, type SimpleGit } from 'simple-git';
import Diff from './Diff.js';
import type { ICommit } from './interfaces.js';

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
  async commit(subject: string, body?: string): Promise<GitCommitResult> {
    try {
      // Check if there are staged changes
      const status = await this.git.status();
      if (status.staged.length === 0) {
        return {
          success: false,
          error: new Error('No staged changes to commit'),
        };
      }

      // Perform the commit
      if (subject && body) await this.git.commit([subject, body]);
      else await this.git.commit(subject);

      // Get the commit hash from the latest commit
      const log = await this.git.log({ maxCount: 1 });
      const commitHash = log.latest?.hash;

      if (!commitHash) throw new Error('Failed to get commit hash after commit');

      return {
        success: true,
        commitHash,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error during commit'),
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

  async log(to: string | number, from?: string): Promise<ICommit[]> {
    const logArgs: Record<string, string | null> = {};

    if (typeof to === 'number') {
      logArgs[`-${to}`] = null;
      logArgs.HEAD = null;
    } else if (!from) {
      logArgs[to] = null;
      logArgs.maxCount = '1';
    } else {
      logArgs.from = from;
      logArgs.to = to;
    }

    // fetch git commit
    const commits = await this.git.log({ ...logArgs });

    return commits.all.map(
      logItem =>
        ({
          hash: logItem.hash,
          short: logItem.hash.slice(0, 7),
          date: new Date(logItem.date),
          msg: [logItem.message, logItem.body].filter(v => v).join('\n\n'),
          author: {
            name: logItem.author_name,
            email: logItem.author_email,
          },
        }) as ICommit,
    );
  }

  /**
   * Get a list of staged files
   */
  async stagedFiles(): Promise<string[]> {
    try {
      const status = await this.git.status();
      return status.staged;
    } catch (error) {
      console.error('Error getting staged files:', error);
      return [];
    }
  }

  /**
   * Get the diff of staged files relative to the last commit (i.e the current HEAD)
   * @param path Optional specific file path to get diff for
   * @returns Diff instance or Error
   */
  async stagedDiff(path?: string): Promise<Diff | Error> {
    if (path) {
      try {
        const diff = await this.git.diff(['--staged', '--', path]);
        return new Diff({ [path]: diff });
      } catch (error: unknown) {
        return new Error(`Error getting staged diff: ${(error as Error).message}`);
      }
    } else {
      // Get all staged files
      const stagedFiles = await this.stagedFiles();

      // Git individual diffs for each staged file.
      const diffs = await Promise.all(stagedFiles.map(v => this.stagedDiff(v)));

      // Reduce over staged diffs, filtering out any errors
      const allDiffs = diffs.reduce((allDiffs: Diff, diff) => {
        if (diff instanceof Error) return allDiffs;
        return allDiffs.merge(diff);
      }, new Diff());

      return allDiffs;
    }
  }
}
