import { readFile, writeFile } from 'node:fs/promises';
import type { CommitPart } from '../CommitMessage/index.js';
import RulesEngine, { type RuleScope } from '../RulesEngine/index.js';
import { exit } from 'node:process';
import Git from '../services/Git/index.js';
import type { GitCommit } from '../services/Git/GitCommit.js';
import { red } from 'yoctocolors';
import filterMap from '../lib/filterMap.js';
import extract from '../lib/extract.js';

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

function scopeToCommitPart(scope: RuleScope): CommitPart {
  switch (scope) {
    case 'body':
      return 'body';
    case 'footer':
    case 'trailer':
    case 'footers':
      return 'footers';
    case 'subject':
      return 'subject';
    case 'scope':
      return 'scope';
    case 'type':
      return 'type';
    case 'namespace':
      return 'namespace';
  }
}

/**
 * Lints a commit message
 * By default takes the latest commit message or
 */
export const Provider = ({ git, readFile, writeFile, exit, logError }: Dependencies) => {
  async function getCommits(commitMsgArgs: [string, string?]): Promise<{ type: 'log' | 'file'; commits: GitCommit[] }> {
    if (isHash(commitMsgArgs[0])) return { type: 'log', commits: await git.log(...commitMsgArgs).catch(() => []) };
    if (isInteger(commitMsgArgs[0]))
      return { type: 'log', commits: await git.log(Number.parseInt(commitMsgArgs[0])).catch(() => []) };
    // Otherwise assume a filepath - create staged commit
    const message = await readFile(commitMsgArgs[0]).catch(() => '');
    if (!message) return { type: 'file', commits: [] };

    const stagedCommit = await git.stagedCommit();
    stagedCommit.message = message;
    return { type: 'file', commits: [stagedCommit] };
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
    const results = commits.map(gitCommit => {
      // Set context for this commit
      rulesEngine.setContext(gitCommit.context);

      // Process commit message with context
      const [processedCommit, valid, errorsAndWarnings] = gitCommit.commitMessage.process(rulesEngine, behaviour);

      // Clear context
      rulesEngine.clearContext();

      const isValid = valid;

      if (!isValid) {
        const errorSections: Record<string, string[]> = {};
        processedCommit.setStyle(red);

        errorsAndWarnings.forEach((error: string) => {
          const [label, errMsg] = extract(error, /\[\w+:\d\]/);
          const [scope, filter] = label.slice(1, -1).split(':');

          const commitPart = scopeToCommitPart(scope as RuleScope);

          processedCommit.style(commitPart, filter);

          errorSections[commitPart] ??= [];
          errorSections[commitPart].push(errMsg);
        });

        const errorMessages = Object.entries(errorSections).reduce((errMsg, section) => {
          const [commitPart, errors] = section;

          errMsg.push([`[${commitPart}]`, errors.map((error: string) => `- ${error.trim()}`).join('\n')].join('\n'));

          return errMsg;
        }, [] as string[]);

        // Construct error Message
        return { commit: processedCommit, error: errorMessages.join('\n\n') };
      }

      return { commit: processedCommit, error: null };
    });

    const allValid = !results.some(result => result.error);

    // Write fixed commit back to file if we have opted to fix and our commit comes from a file.
    if (behaviour === 'fix' && type === 'file' && results[0]) {
      await writeFile(args[0], results[0].commit.unstyle().toString());
    }

    /*
      If not all valid, construct an error message for every commit that failed.
      Show the commit that failed, highlighting (styling) the part of the commit that failed
      Show all the errors underneath as a list.
    */
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
