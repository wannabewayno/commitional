import CommitMessage from '../../CommitMessage/index.js';
import type { GitContext } from '../../RulesEngine/GitContext.js';

export class GitCommit {
  constructor(
    public hash: string,
    public message: string,
    public files: string[],
    public isStaged = false,
  ) {}

  get commitMessage(): CommitMessage {
    return CommitMessage.fromString(this.message);
  }

  get context(): GitContext {
    return { files: this.files, isStaged: this.isStaged };
  }
}
