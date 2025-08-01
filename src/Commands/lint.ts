import { readFile, writeFile } from 'node:fs/promises';
import CommitMessage from '../CommitMessage/index.js';
import RulesEngine from '../RulesEngine/index.js';
import { exit } from 'node:process';
import Git from '../services/Git/index.js';
import { red } from 'yoctocolors';
import filterMap from '../lib/filterMap.js';

interface LintOpts {
  fix?: boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: required for generic type
type CloneFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;

interface Dependencies {
  git: Git;
  readFile: (path: string) => Promise<string>;
  writeFile: CloneFunction<typeof writeFile>;
  logError: CloneFunction<typeof console.error>;
  exit: CloneFunction<typeof exit>;
}

type LintCmd = (commitMsgArg: string, opts: LintOpts) => Promise<void>;

const isHash = (str: string) => /^[0-9a-f]{7,}$/.test(str);
const isInteger = (str: string) => /^\d+$/.test(str);

/**
 * Lints a commit message
 * By default takes the latest commit message or
 */
export const Provider = ({ git, readFile, writeFile, exit, logError }: Dependencies) => {
  async function getCommits(
    commitMsgArgs: [string, string?],
  ): Promise<{ type: 'log' | 'file'; commits: { msg: string }[] }> {
    if (isHash(commitMsgArgs[0])) return { type: 'log', commits: await git.log(...commitMsgArgs).catch(() => []) };
    if (isInteger(commitMsgArgs[0]))
      return { type: 'log', commits: await git.log(Number.parseInt(commitMsgArgs[0])).catch(() => []) };
    // Otherwise assume a filepath
    return {
      type: 'file',
      commits: await readFile(commitMsgArgs[0])
        .then(msg => [{ msg }])
        .catch(() => []),
    };
  }

  return async (commitMsgArg: string, opts: LintOpts) => {
    // Parse commitsMsgArg to determine type
    const args = commitMsgArg.split('...') as [string, string?];

    const { type, commits } = await getCommits(args);

    // load the rules engine
    const rulesEngine = await RulesEngine.fromConfig();

    // fix vs validate
    const behaviour = opts.fix ? 'fix' : 'validate';

    // Lint all commits against the rules engine
    const results = commits.map(({ msg }) => {
      const [commit, valid, errorsAndWarnings] = CommitMessage.fromString(msg).process(rulesEngine, behaviour);

      const errorSections: string[] = [];
      if (!valid) {
        commit.setStyle(red);

        errorsAndWarnings.forEach(({ type, filter, errors }) => {
          if (errors.length > 0) {
            commit.style(type, filter);
            errorSections.push(`${type}\n${errors.map(error => `- ${error}`).join('\n')}`);
          }
        });
      }

      return { commit, error: errorSections.length ? errorSections.join('\n\n') : null };
    });

    const allValid = !results.some(result => result.error);

    // Write fixed commit back to file if we have opted to fix and our commit comes from a file.
    if (behaviour === 'fix' && type === 'file' && results[0]) {
      await writeFile(args[0], results[0].commit.unstyle().toString());
    }

    if (!allValid) {
      const errorMessage = filterMap(results, ({ commit, error }) => {
        if (!error) return undefined;
        return `---\n${commit.toString()}\n\n${error}`;
      }).join('\n\n');

      logError(errorMessage);
    }

    exit(allValid ? 0 : 1);
  };
};

export default (): LintCmd => {
  const git = new Git();
  return Provider({ git, exit, readFile: (path: string) => readFile(path, 'utf-8'), writeFile, logError: console.error });
};
