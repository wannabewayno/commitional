import type { CommitMessage } from '../prompts.js';

export function formatCommitMessage(commit: CommitMessage): string {
  const prefix = commit.breaking ? 'BREAKING CHANGE: ' : '';
  const header = `${commit.type}${commit.breaking ? '!' : ''}: ${prefix}${commit.subject}`;

  if (!commit.body) {
    return header;
  }

  return `${header}\n\n${commit.body}`;
}
