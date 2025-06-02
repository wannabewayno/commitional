import type { CommitMessage } from '../prompts/index.js';

export function formatCommitMessage(commit: CommitMessage): [subject: string, body?: string] {
  const prefix = commit.scope ? `${commit.type}(${commit.scope})` : commit.type;
  const subject = `${prefix}: ${commit.title}${commit.breaking ? ' ⚠️' : ''}`;

  if (!commit.body) return [subject];
  return [subject, commit.body];
}
