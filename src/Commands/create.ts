import CommitMessage, { type CommitPart, type CommitJSON } from '../CommitMessage/index.js';
import Git from '../services/Git/index.js';
import RulesEngine from '../RulesEngine/index.js';
import { CommitPartFactory, PromptFactory } from '../prompts/index.js';
import { confirm, input } from '@inquirer/prompts';
import { blue, green, red } from 'yoctocolors';
import ora from 'ora';
import PromptFlow from '../PromptFlow/index.js';
import Highlighter from '../lib/highlighter.js';

interface DefaultOpts extends Partial<CommitJSON> {
  breaking?: boolean;
  auto: boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: required for generic type
type CloneFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;

interface Dependencies {
  git: Git;
  rulesEngine: RulesEngine;
  log: CloneFunction<typeof console.log>;
}

export type DefaultCmd = (opts: DefaultOpts) => Promise<void>;

export const Provider = ({ git, rulesEngine, log }: Dependencies) => {
  const target = (value: string) => `${red('<')}${value}${red('>')}`;
  const add = (value: string) => `${red('>')}${value}${red('<')}`;
  const highlighter = Highlighter(
    value => target(green(value)),
    value => add(blue(value)),
  );

  return async (opts: DefaultOpts) => {
    // Check if we're actually in a git repository first
    const isRepo = await git.isRepository();
    if (!isRepo) throw new Error('Not a git repository');

    // Find the files currently staged to be committed
    const diff = await git.stagedDiff();
    if (diff instanceof Error) throw diff;

    // if there's no staged files, there's nothing to commit, return early without throwing an error. Just let the user know.
    // TODO: Open a diaglog showing the user modified or untracked files and ask them if they want to stage anything.
    // ? this get's complicated with scope...
    if (!diff.files.length) return log(red('No files staged to commit'));

    // Extract any cli options passed down from the user
    const { auto, breaking, ...partialCommit } = opts;

    const commit = CommitMessage.fromJSON(partialCommit);

    const commitFactory = CommitPartFactory(rulesEngine, diff, commit, auto);

    for (const commitPart of ['scope', 'type', 'subject', 'body'] as CommitPart[]) {
      await commitFactory(commitPart, commit);
    }

    // Ask the user if this is a breaking change if not already known
    if (opts.breaking === undefined)
      opts.breaking = await confirm({ message: 'Does this change introduce any breaking changes?' });

    // If it is a breaking change...
    if (opts.breaking) {
      // Ask the user why it's a breaking change.
      const breaking = await input({
        message: 'Describe the breaking change:',
        required: true,
      });

      // Mark the commit as a breaking change.
      commit.breaking(breaking);
    }

    // go and set the style for each part
    (['type', 'scope', 'subject', 'body', 'footer'] as CommitPart[]).forEach(commitPart =>
      commit.setStyle((value: string) => highlighter(value, commitPart), commitPart),
    );

    const footers = commit.footers.filter(v => !/^BREAKING[\s-]CHANGE/.test(v)).map(v => `footer:${v.replace(/:.+$/, '')}`);

    const promptFactory = PromptFactory(rulesEngine);

    const scope = promptFactory('scope');
    const type = promptFactory('type');
    const subject = promptFactory('subject');
    const body = promptFactory('body');
    const footer = promptFactory('footers');

    await PromptFlow.build()
      .addBreak('Commit')
      .addHandler('type', () => type.prompt(commit.unstyle()).then(() => false))
      .addHandler('scope', () => scope.prompt(commit.unstyle()).then(() => false))
      .addHandler('subject', () => subject.prompt(commit.unstyle()).then(() => false))
      .addHandler('body', () => body.prompt(commit.unstyle()).then(() => false))
      .addHandler('footer', async (choice, choices) => {
        const footersBefore = commit.footers.length;

        await footer.prompt(commit.unstyle(), choice.value);

        const footersAfter = commit.footers.length;

        if (footersAfter > footersBefore) {
          // biome-ignore lint/style/noNonNullAssertion: We know there will at least one entry
          const [token = ''] = commit.footers.at(-1)!.split(':');

          // get our created footer
          const createdFooter = commit.footer(token);
          if (createdFooter) createdFooter.setStyle(highlighter); // assign styles to emphaize it when selected

          choices.splice(-1, 0, `footer:${token}`);
        } else if (footersAfter < footersBefore) {
          choices.splice(choice.index, 1);
        }

        return false;
      })
      .addHandler('breaking', async () => {
        commit.unstyle();

        // Mark the commit as a breaking change.
        commit.breaking();

        if (commit.isBreaking) {
          const breakingDescription = commit.footer('BREAKING CHANGE');
          if (!breakingDescription) {
            // Ask the user why it's a breaking change.
            const breaking = await input({
              message: 'BREAKING CHANGE',
              required: true,
            });

            commit.footer('BREAKING CHANGE:', breaking);
          } else {
            // Edit the breaking change
            await footer.prompt(commit, 'BREAKING CHANGE');
          }
        }

        return false;
      })
      .construct(
        'Commit or Edit',
        [
          'Commit',
          PromptFlow.Separator(),
          'type',
          'scope',
          'subject',
          'body',
          ...footers,
          'footer:add footer',
          'breaking',
        ].concat(),
        {
          banner: choice => {
            // Reset previous styles
            commit.unstyle();

            const [part = '', filter] = (choice.value as string).split(':');
            if (!['Commit', 'breaking'].includes(part)) commit.style(part as CommitPart, filter);

            const presentation = ['\n------------', commit.toString()];
            if (filter === 'add footer') presentation.push(`\n${highlighter('', 'footer')}`);
            else presentation.push('\n');

            return presentation.join('\n');
          },
          loop: false,
        },
      )
      .prompt();

    const spinner = ora('Commiting...').start();

    const res = await git.commit(commit.toString());

    if (res.success) spinner.succeed(res.commitHash);
    else spinner.fail(res.error?.message);
  };
};

export default (): DefaultCmd => {
  const git = new Git();
  return async (opts: DefaultOpts) => {
    const rulesEngine = await RulesEngine.fromConfig();
    return Provider({ git, rulesEngine, log: console.log })(opts);
  };
};
