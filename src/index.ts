import { Command } from 'commander';
import CommitMessage from './CommitMessage/index.js';
import Git from './services/Git/index.js';
import RulesEngine, { type CommitPart } from './RulesEngine/index.js';
import loadConfig from './config/index.js';
import { CommitPartFactory, PromptFactory } from './prompts/index.js';
import { confirm } from '@inquirer/prompts';
import { blue, green, red } from 'yoctocolors';
import ora from 'ora';
import PromptFlow from './PromptFlow/index.js';

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
  .version(process.env.VERSION ?? 'dev', '-v, --version', 'Output the current version')
  .option('-t, --type [type]', 'Commit type; feat, fix, test ...')
  .option('-S, --scope [scope]', 'Commit scope (if any)')
  .option('-s, --subject [subject]', 'Commit subject')
  .option('-b, --body [body]', 'Commit body')
  .option('-f, --footer [footer[]]', 'Commit footer(s)')
  .option('-B, --breaking', 'Is this a Breaking change?')
  .option('-A, --auto', 'Use Generative AI to pre-fill your commit message', false)
  .addHelpCommand('help [command]', 'Display help for command')
  .action(async (opts: Partial<Record<CommitPart, string>> & { breaking?: boolean; auto: boolean }) => {
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

    const commit = CommitMessage.fromParts(partialCommit);

    commit.scope = await commitFactory('scope', commit);
    commit.type = await commitFactory('type', commit);
    commit.subject = await commitFactory('subject', commit);
    commit.body = await commitFactory('body', commit);

    // Ask the user if this is a breaking change if not already known
    if (opts.breaking === undefined)
      opts.breaking = await confirm({ message: 'Does this change introduce any breaking changes?' });

    // If it is a breaking change...
    if (opts.breaking) {
      // Mark the commit as a breaking change.
      // TODO: Ask the user why it's breaking and use this as the footer message.
      commit.breaking();
    }

    const emphasis = (name: string, value?: string) => {
      return `${red('>')}${value ? green(value) : blue(`Add ${name}?`)}${red('<')}`;
    };

    /**
     * Renders a preview of the commit message with the current part highlighted
     * @param emphasis - The part to emphasize in the preview
     * @param value - The value to show for the emphasized part
     * @returns Formatted commit message text
     */
    function renderText(commit: CommitMessage, toHighlight: CommitPart) {
      const commitJsonWithEmphasis = {
        type: commit.type,
        scope: commit.scope,
        subject: commit.subject,
        body: commit.body,
        // footer: merged.footer ?? requiredProps.,
        [toHighlight]: emphasis(toHighlight, commit[toHighlight]),
      };

      // Format the commit message with all parts
      return CommitMessage.fromParts(commitJsonWithEmphasis).toString();
    }

    const promptFactory = PromptFactory(rulesEngine);

    await new PromptFlow(
      'Commit or Edit',
      {
        Commit: PromptFlow.Break,
        // TODO: Refactor this to provide a way to set Separators
        type: () =>
          promptFactory('type')
            .prompt(commit.type)
            .then(type => {
              commit.type = type;
            }),
        scope: () =>
          // Check to see if multiple scopes are allowed. If So allow the user add or remove scopes
          // Otherwise simply show a list to choose from or free form input that will be used to override the current scope
          promptFactory('scope')
            .prompt()
            .then(scope => {
              commit.scope = scope;
            }),
        subject: () =>
          promptFactory('subject')
            .prompt(commit.subject)
            .then(subject => {
              commit.subject = subject;
            }),
        body: () =>
          promptFactory('body')
            .prompt(commit.body)
            .then(body => {
              commit.body = body;
            }),
        // TODO: Ask why it's breaking
        breaking: () => {
          commit.breaking();
        },
      },
      {
        banner: choice => renderText(commit, choice.value as CommitPart),
      },
    ).prompt();

    const spinner = ora('Commiting...').start();

    const res = await git.commit(commit.toString());

    if (res.success) spinner.succeed(res.commitHash);
    else spinner.fail(res.error?.message);
  });

await program.parseAsync(process.argv);
