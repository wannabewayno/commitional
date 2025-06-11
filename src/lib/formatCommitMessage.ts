import type { CommitMessage } from '../prompts/index.js';
import { commitHeader } from './formatCommitHeader.js';

export function formatCommitMessage(commit: CommitMessage): [subject: string, body?: string] {
  const subject = commitHeader(commit);

  if (!commit.body) return [subject];
  return [subject, commit.body];
}
