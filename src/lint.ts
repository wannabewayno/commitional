import { readFile } from 'node:fs/promises';
import CommitMessage from './CommitMessage/index.js';

interface LintOpts {
  edit?: boolean;
}

/**
 * Lints a commit message
 * By default takes the latest commit message or
 */
export default async (commitMsgPath: string, _opts: LintOpts) => {
  const commit = await readFile(commitMsgPath, 'utf-8').then(CommitMessage.fromString);
  console.log(commit);

  // load the commit message unless a flag was parsed to get some other commit message.

  // parse current rules.

  // show the rules to user and start a TTY shell with commitional to edit the message. and save it back to the temporary file.
};
