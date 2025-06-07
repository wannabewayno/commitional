import type { CommitMessage } from '../prompts/index.js';
import { commitSubject } from './formatCommitBody.js';

export function formatCommitMessage(commit: CommitMessage): [subject: string, body?: string] {
  const subject = commitSubject(commit);

  if (!commit.body) return [subject];
  return [subject, commit.body];
}
