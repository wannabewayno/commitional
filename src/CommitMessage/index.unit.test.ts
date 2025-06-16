import CommitMessage from './index.js';
import { expect } from 'chai';

describe('Commit Message Formatting', () => {
  it('should format a basic commit message', () => {
    const commit = {
      type: 'feat',
      subject: 'Add new feature',
      body: '',
    };
    const message = CommitMessage.fromJSON(commit).toString();
    expect(message, 'feat: Add new feature');
  });

  it('should format a commit message with breaking change', () => {
    const commit = {
      type: 'feat',
      subject: 'Add breaking feature',
      body: '',
      breaking: true,
    };
    const message = CommitMessage.fromJSON(commit).breaking().toString();
    expect(message).to.equal('feat!: Add breaking feature ⚠️');
  });

  it('should format a commit message with body', () => {
    const commit = {
      type: 'fix',
      subject: 'Fix critical bug',
      body: 'This fixes a critical issue\nThat was causing problems',
      breaking: false,
    };

    const message = CommitMessage.fromJSON(commit).toString();
    expect(message, 'fix: Fix critical bug\nThis fixes a critical issue\nThat was causing problems');
  });

  it('should format a breaking commit message with body', () => {
    const commit = {
      subject: 'Fix critical bug',
      body: 'This fixes a critical issue\nThat was causing problems',
    };
    const message = CommitMessage.fromJSON(commit).breaking().toString();
    expect(message, 'Fix critical bug ⚠️\nThis fixes a critical issue\nThat was causing problems');
  });
});
