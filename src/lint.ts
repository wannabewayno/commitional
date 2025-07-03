// import { readFile } from 'node:fs/promises';
// import CommitMessage from './CommitMessage/index.js';
// import RulesEngine from './RulesEngine/index.js';

interface LintOpts {
  edit?: boolean;
}

/**
 * Lints a commit message
 * By default takes the latest commit message or
 */
export default async (_commitMsgPath: string, _opts: LintOpts) => {
  // const commit = await readFile(commitMsgPath, 'utf-8').then(CommitMessage.fromString);
  // load the commit message unless a flag was parsed to get some other commit message.
  // load the rules engine
  // const rulesEngine = RulesEngine.fromConfig();
  // Return a new commit so as not to mutate the original?
  // commit.process(rulesEngine);
  // Should be on the commitMessage so we set it as we go.
  // show the rules to user and start a TTY shell with commitional to edit the message. and save it back to the temporary file.
};
