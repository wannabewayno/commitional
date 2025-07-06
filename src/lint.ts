import { readFile, writeFile } from 'node:fs/promises';
import CommitMessage from './CommitMessage/index.js';
import RulesEngine from './RulesEngine/index.js';
import { exit } from 'node:process';
import Git from './services/Git/index.js';

interface LintOpts {
  edit?: boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: required for generic type
type CloneFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;

interface Dependencies {
  git: Git;
  readFile: (path: string) => Promise<string>;
  writeFile: CloneFunction<typeof writeFile>;
  exit: CloneFunction<typeof exit>;
}

type LintCmd = (commitMsgArg: string, opts: LintOpts) => Promise<void>;

/**
 * Lints a commit message
 * By default takes the latest commit message or
 */
export const Provider =
  ({ git, readFile, exit }: Dependencies) =>
  async (commitMsgArg: string, opts: LintOpts) => {
    // Parse commitsMsgArg to determine type
    const args = commitMsgArg.split('...') as [string, string?];

    // is a commit hash.
    const commits = await (/^[0-9a-f]{7,}$/.test(args[0]) ? git.log(...args) : readFile(args[0]).then(msg => [{ msg }]));

    // load the rules engine
    const rulesEngine = await RulesEngine.fromConfig();

    // Lint all commits against the rules engine
    // TODO: write option will attempt to fix before casting validation
    const results = commits.map(({ msg }) => {
      return CommitMessage.fromString(msg).process(rulesEngine);
    });

    const allValid = results.some(result => !result[1]);

    if (!allValid && opts.edit) {
      // TODO:
    }

    exit(allValid ? 0 : 1);
  };

export default (): LintCmd => {
  const git = new Git();
  return Provider({ git, exit, readFile: (path: string) => readFile(path, 'utf-8'), writeFile });
};
