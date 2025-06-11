import type { CommitMessage } from '../prompts/index.js';

const isNotEmpty = (maybeStr?: string) => !!maybeStr;

export function commitHeader(commit: Omit<CommitMessage, 'body'>): string {
  const header = [];
  if (isNotEmpty(commit.type)) header.push(commit.type);
  if (isNotEmpty(commit.scope)) header.push(`(${commit.scope})`);
  if (header.length) header.push(':');
  if (isNotEmpty(commit.subject)) header.push(` ${commit.subject}`);
  if (commit.breaking) header.push(' ⚠️');

  return header.join('');
}
