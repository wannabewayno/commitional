import { simpleGit } from 'simple-git';

// Initialize simple-git instance
const git = simpleGit();

/**
 * Check if the current directory is inside a Git repository
 */
export async function isGitRepository(): Promise<boolean> {
  try {
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
    const status = await git.status();
    return status.staged;
  } catch (error) {
    console.error('Error getting staged files:', error);
    return [];
  }
}

/**
 * Get the diff of staged changes
 */
export async function getStagedDiff(): Promise<string> {
  try {
    const diff = await git.diff(['--cached']);
    return diff;
  } catch (error) {
    console.error('Error getting staged diff:', error);
    return '';
  }
}
