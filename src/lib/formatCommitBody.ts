import type { CommitMessage } from '../prompts/index.js';

export function commitSubject(commit: Omit<CommitMessage, 'body'>): string {
  const prefix = commit.scope ? `${commit.type}(${commit.scope})` : commit.type;
  const subject = `${prefix}: ${commit.title}${commit.breaking ? ' ⚠️' : ''}`;

  return subject;
}
