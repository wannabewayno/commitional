import { Command } from 'commander';
import packageJSON from '../package.json' with { type: 'json' };
import { formatCommitMessage } from './lib/formatCommitMessage.js';
import Git from './services/Git/index.js';
import RulesEngine from './rules/index.js';
import { ScopeDeducer } from './services/ScopeDeducer/index.js';
import loadConfig from './config/index.js';
import { CommitMessage, CommitPartFactory, PromptFactory, PromptFlow } from './prompts/index.js';
import { confirm } from '@inquirer/prompts';
import { blue, green, red } from 'yoctocolors';
import ora, { oraPromise } from 'ora';
import { commitHeader } from './lib/formatCommitHeader.js';
import { select, type SelectWithBannerConfig, Separator } from 'inquirer-select-with-banner';
import { truncate } from './lib/truncate.js';

process.on('uncaughtException', error => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    console.log('👋 bye!');
  } else {
    // Rethrow unknown errors
    throw error;
  }
});

const program = new Command();

program
  .name('commitional')
  .description('CLI tool for crafting commit messages - compatible with commitlint')
  .version(packageJSON.version, '-v, --version', 'Output the current version')
  .option('-t, --type <type>', 'Commit type; feat, fix, test ...')
  .option('-S, --scope <scope>', 'Commit scope (if any)')
  .option('-s, --subject <subject>', 'Commit subject')
  .option('-b, --body <body>', 'Commit body')
  .option('-B, --breaking', 'Is this a Breaking change?')
  .option('-A, --auto', 'Use Generative AI to pre-fill your commit message', false)
  .addHelpCommand('help [command]', 'Display help for command')
  .action(
    async (opts: { type?: string; scope?: string; subject?: string; breaking?: boolean; body?: string; auto: boolean }) => {
      /*
        If the user has configured commitlint in the current working directory, attempt to load commitlint's config.
        We'll guide the user in creating a commit message that adheres to the commitlint config.
        Otherwise it'll load a default config.
      */
      const config = await loadConfig();

      // Create a new *git* instance scoped to the cwd
      const git = new Git();

      // Check if we're in a git repository first
      const isRepo = await git.isRepository();
      if (!isRepo) throw new Error('Not a git repository');

      const diff = await git.stagedDiff();
      if (diff instanceof Error) throw diff;

      // if there's no staged files, there's nothing to commit, return early without throwing an error. Just let the user know.
      if (!diff.files.length) return console.log(red('No files staged to commit'));

      // Create our rules engine from the parsed in commitlint config.
      const rulesEngine = RulesEngine.fromConfig(config.rules);

      const { auto, ...partialCommit } = opts;

      const commitFactory = CommitPartFactory(rulesEngine, diff, auto);

      const scope = await commitFactory('scope', partialCommit);
      partialCommit.scope = scope;

      const type = await commitFactory('type', partialCommit);
      partialCommit.type = type;

      const subject = await commitFactory('subject', partialCommit);
      partialCommit.subject = subject;

      const body = await commitFactory('body', partialCommit);
      partialCommit.body = body;

      // Ask the user if this is a breaking
      const breaking =
        opts.breaking !== undefined
          ? opts.breaking
          : await confirm({ message: 'Does this change introduce any breaking changes?' });

      const commit = {
        type,
        subject,
        body,
        breaking,
        scope,
      };

      const formatpart = (part: keyof typeof commit, selection: string) => {
        if (part === 'breaking') return '';
        if (selection !== part) return commit[part];
        const value = commit[part];
        return `${red('>')}${value ? green(value) : blue(`Add ${part}?`)}${red('<')}`;
      };

      const promptFactory = PromptFactory(rulesEngine);

      await new PromptFlow(
        'Commit or Edit',
        {
          Commit: PromptFlow.Break,
          type: () =>
            promptFactory('type')
              .prompt()
              .then(type => {
                commit.type = type;
                return;
              }),
          scope: () => console.log('scope!'),
          subject: () => console.log('subject!'),
          body: () => console.log('body!'),
          breaking: () => console.log('breaking!'),
        },
        {
          banner: choice => {
            const [Subject, Body] = formatCommitMessage({
              type: formatpart('type', choice.name),
              subject: formatpart('subject', choice.name),
              body: formatpart('body', choice.name),
              breaking,
              scope: formatpart('scope', choice.name),
            });

            return `\n----------------------------------------\n${Subject}\n\n${Body}`;
          },
        },
      ).prompt();

      const spinner = ora('Commiting...').start();

      const res = await git.commit(...formatCommitMessage(commit));

      if (res.success) spinner.succeed(res.commitHash);
      else spinner.fail(res.error?.message);
    },
  );

await program.parseAsync(process.argv);
