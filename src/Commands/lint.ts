import { readFile, writeFile } from 'node:fs/promises';
import CommitMessage from '../CommitMessage/index.js';
import RulesEngine from '../RulesEngine/index.js';
import { exit } from 'node:process';
import Git from '../services/Git/index.js';
import { red } from 'yoctocolors';
import filterMap from '../lib/filterMap.js';

interface LintOpts {
  edit?: boolean;
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

/**
 * Lints a commit message
 * By default takes the latest commit message or
 */
export const Provider =
  ({ git, readFile, writeFile, exit, logError }: Dependencies) =>
  async (commitMsgArg: string, opts: LintOpts) => {
    // Parse commitsMsgArg to determine type
    const args = commitMsgArg.split('...') as [string, string?];

    const isFile = !/^[0-9a-f]{7,}$/.test(args[0]);
    const commits = await (isFile ? readFile(args[0]).then(msg => [{ msg }]) : git.log(...args)).catch(() => []);

    // load the rules engine
    const rulesEngine = await RulesEngine.fromConfig();

    // Lint all commits against the rules engine
    const results = commits.map(({ msg }) => {
      // TODO: write option will attempt to fix before casting validation
      const [commit, valid, errorsAndWarnings] = CommitMessage.fromString(msg).process(rulesEngine);

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

    // Write fixed commit back to file if --fix is used and it's a file
    if (opts.fix && isFile && results[0]) {
      await writeFile(args[0], results[0].commit.unstyle().toString());
    }

    if (!allValid) {
      const errorMessage = filterMap(results, ({ commit, error }) => {
        if (!error) return undefined;
        return `---\n${commit.toString()}\n\n${error}`;
      }).join('\n\n');

      logError(errorMessage);

      if (opts.edit) {
        // TODO:
      }
    }

    exit(allValid ? 0 : 1);
  };

export default (): LintCmd => {
  const git = new Git();
  return Provider({ git, exit, readFile: (path: string) => readFile(path, 'utf-8'), writeFile, logError: console.error });
};
