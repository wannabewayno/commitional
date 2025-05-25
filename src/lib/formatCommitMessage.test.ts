import assert from 'node:assert';
import { formatCommitMessage } from './formatCommitMessage.js';

describe('Commit Message Formatting', () => {
  it('should format a basic commit message', () => {
    const commit = {
      type: 'feat',
      subject: 'Add new feature',
      body: '',
      breaking: false,
    };
    const formatted = formatCommitMessage(commit);
    assert.strictEqual(formatted, 'feat: Add new feature');
  });

  it('should format a commit message with breaking change', () => {
    const commit = {
      type: 'feat',
      subject: 'Add breaking feature',
      body: '',
      breaking: true,
    };
    const formatted = formatCommitMessage(commit);
    assert.strictEqual(formatted, 'feat!: BREAKING CHANGE: Add breaking feature');
  });

  it('should format a commit message with body', () => {
    const commit = {
      type: 'fix',
      subject: 'Fix critical bug',
      body: 'This fixes a critical issue\nThat was causing problems',
      breaking: false,
    };
    const formatted = formatCommitMessage(commit);
    assert.strictEqual(formatted, 'fix: Fix critical bug\n\nThis fixes a critical issue\nThat was causing problems');
  });
});
