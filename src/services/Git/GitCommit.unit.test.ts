import { GitCommit } from './GitCommit.js';
import CommitMessage from '../../CommitMessage/index.js';
import { expect } from 'chai';

describe('GitCommit', () => {
  describe('constructor', () => {
    it('should create GitCommit with all properties', () => {
      const gitCommit = new GitCommit('abc123', 'feat: add new feature', ['src/file.ts'], false);

      expect(gitCommit.hash).to.equal('abc123');
      expect(gitCommit.message).to.equal('feat: add new feature');
      expect(gitCommit.files).to.deep.equal(['src/file.ts']);
      expect(gitCommit.isStaged).to.be.false;
    });

    it('should default isStaged to false', () => {
      const gitCommit = new GitCommit('abc123', 'feat: add new feature', ['src/file.ts']);

      expect(gitCommit.isStaged).to.be.false;
    });
  });

  describe('commitMessage getter', () => {
    it('should parse message into CommitMessage object', () => {
      const gitCommit = new GitCommit('abc123', '[myapp] feat(auth): add login system', ['apps/myapp/auth.ts']);

      const commitMessage = gitCommit.commitMessage;
      expect(commitMessage).to.be.instanceOf(CommitMessage);
      expect(commitMessage.namespace).to.equal('myapp');
      expect(commitMessage.type).to.equal('feat');
      expect(commitMessage.scope).to.equal('auth');
      expect(commitMessage.subject).to.equal('add login system');
    });
  });

  describe('context getter', () => {
    it('should return GitContext with files and isStaged', () => {
      const gitCommit = new GitCommit('abc123', 'feat: add feature', ['src/file1.ts', 'src/file2.ts'], true);

      const context = gitCommit.context;
      expect(context.files).to.deep.equal(['src/file1.ts', 'src/file2.ts']);
      expect(context.isStaged).to.be.true;
    });

    it('should return context for non-staged commit', () => {
      const gitCommit = new GitCommit('abc123', 'feat: add feature', ['src/file.ts'], false);

      const context = gitCommit.context;
      expect(context.files).to.deep.equal(['src/file.ts']);
      expect(context.isStaged).to.be.false;
    });
  });
});
