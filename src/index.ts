import { Command } from 'commander';
import CommitMessage, { type CommitJSON } from './CommitMessage/index.js';
import Git from './services/Git/index.js';
import RulesEngine, { type CommitPart } from './RulesEngine/index.js';
import loadConfig from './config/index.js';
import { CommitPartFactory, PromptFactory } from './prompts/index.js';
import { confirm } from '@inquirer/prompts';
import { blue, green, red } from 'yoctocolors';
import ora from 'ora';
import PromptFlow from './PromptFlow/index.js';
import Highlighter from './lib/highlighter.js';

process.on('uncaughtException', error => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    console.log('👋 bye!');
  } else {
    // Rethrow unknown errors
    throw error;
  }
});

const target = (value: string) => `${red('<')}${value}${red('>')}`;
const add = (value: string) => `${red('>')}${value}${red('<')}`;
const highlighter = Highlighter(
  value => target(green(value)),
  value => add(blue(value)),
);

const program = new Command();

program
  .name('commitional')
  .description('CLI tool for crafting commit messages - compatible with commitlint')
  .version(process.env.VERSION ?? 'dev', '-v, --version', 'Output the current version')
  .option('-t, --type [type]', 'Commit type; feat, fix, test ...')
  .option('-S, --scope [scope]', 'Commit scope (if any)')
  .option('-s, --subject [subject]', 'Commit subject')
  .option('-b, --body [body]', 'Commit body')
  .option('-f, --footer [footer...]', 'Commit footer(s)')
  .option('-B, --breaking', 'Is this a Breaking change?')
  .option('-A, --auto', 'Use Generative AI to pre-fill your commit message', false)
  .addHelpCommand('help [command]', 'Display help for command')
  .action(async (opts: Partial<CommitJSON> & { breaking?: boolean; auto: boolean }) => {
    /*
      If the user has configured commitlint in the current working directory, attempt to load commitlint's config.
      We'll guide the user in creating a commit message that adheres to the commitlint config.
      Otherwise it'll load a default config.
    */
    const config = await loadConfig();

    // Create a new *git* instance scoped to the cwd
    const git = new Git();

    // Check if we're actually in a git repository first
    const isRepo = await git.isRepository();
    if (!isRepo) throw new Error('Not a git repository');

    // Find the files currently staged to be committed
    const diff = await git.stagedDiff();
    if (diff instanceof Error) throw diff;

    // if there's no staged files, there's nothing to commit, return early without throwing an error. Just let the user know.
    // TODO: Open a diaglog showing the user modified or untracked files and ask them if they want to stage anything.
    // ? this get's complicated with scope...
    if (!diff.files.length) return console.log(red('No files staged to commit'));

    // Create a rules engine from the parsed in commitlint config.
    const rulesEngine = RulesEngine.fromConfig(config.rules);

    // Extract any cli options passed down from the user
    const { auto, breaking, ...partialCommit } = opts;

    const commitFactory = CommitPartFactory(rulesEngine, diff, auto);

    const commit = CommitMessage.fromJSON(partialCommit);

    await commitFactory('scope', commit);
    await commitFactory('type', commit);
    await commitFactory('subject', commit);
    await commitFactory('body', commit);

    // Ask the user if this is a breaking change if not already known
    if (opts.breaking === undefined)
      opts.breaking = await confirm({ message: 'Does this change introduce any breaking changes?' });

    // If it is a breaking change...
    if (opts.breaking) {
      // Mark the commit as a breaking change.
      // TODO: Ask the user why it's breaking and use this as the footer message.
      commit.breaking();
    }

    // go and set the style for each part
    (['type', 'scope', 'subject', 'body', 'footer'] as CommitPart[]).forEach(commitPart =>
      commit.setStyle((value: string) => highlighter(value, commitPart), commitPart),
    );

    const footers = (commit.toJSON()?.footer ?? []).map(v => `footer:${v.replace(/:.+$/, '')}`);

    const promptFactory = PromptFactory(rulesEngine);

    const scope = promptFactory('scope');
    const type = promptFactory('type');
    const subject = promptFactory('subject');
    const body = promptFactory('body');
    const footer = promptFactory('footer');

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
          if (createdFooter) createdFooter.setStyle(highlighter);

          choices.splice(-1, 0, `footer:${token}`);
        } else if (footersAfter < footersBefore) {
          choices.splice(choice.index, 1);
        }

        return false;
      })
      .addHandler('breaking', () => {
        // TODO: Ask why it's breaking (but only if the message has changed from last time)
        commit.breaking();
        return false;
      })
      .construct(
        'Commit or Edit',
        ['Commit', PromptFlow.Separator(), 'type', 'scope', 'subject', 'body', ...footers, 'footer:add footer'].concat(),
        {
          banner: choice => {
            // Reset previous styles
            commit.unstyle();

            const [part, filter] = (choice.value as string).split(':');
            if (part !== 'Commit') commit.style(part as CommitPart, filter);

            let commitStr = commit.toString();
            if (filter === 'add footer') commitStr += `\n\n${highlighter('', 'footer')}`;

            return commitStr;
          },
          loop: false,
        },
      )
      .prompt();

    const spinner = ora('Commiting...').start();

    const res = await git.commit(commit.toString());

    if (res.success) spinner.succeed(res.commitHash);
    else spinner.fail(res.error?.message);
  });

await program.parseAsync(process.argv);
