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
    const [subject, body] = formatCommitMessage(commit);
    assert.strictEqual(subject, 'feat: Add new feature');
    assert.strictEqual(body, undefined);
  });

  it('should format a commit message with breaking change', () => {
    const commit = {
      type: 'feat',
      subject: 'Add breaking feature',
      body: '',
      breaking: true,
    };
    const [subject, body] = formatCommitMessage(commit);
    assert.strictEqual(subject, 'feat: Add breaking feature ⚠️');
    assert.strictEqual(body, undefined);
  });

  it('should format a commit message with body', () => {
    const commit = {
      type: 'fix',
      subject: 'Fix critical bug',
      body: 'This fixes a critical issue\nThat was causing problems',
      breaking: false,
    };
    const [subject, body] = formatCommitMessage(commit);
    assert.strictEqual(subject, 'fix: Fix critical bug');
    assert.strictEqual(body, 'This fixes a critical issue\nThat was causing problems');
  });

  it('should format a commit message with body', () => {
    const commit = {
      subject: 'Fix critical bug',
      body: 'This fixes a critical issue\nThat was causing problems',
      breaking: true,
    };
    const [subject, body] = formatCommitMessage(commit);
    assert.strictEqual(subject, 'Fix critical bug ⚠️');
    assert.strictEqual(body, 'This fixes a critical issue\nThat was causing problems');
  });
});
