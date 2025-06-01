import { Command } from 'commander';
import load from '@commitlint/load';
import packageJSON from '../package.json' with { type: 'json' };
import type { CommitMessage } from './prompts.js';
import { formatCommitMessage } from './lib/formatCommitMessage.js';
import Git from './services/Git/index.js';
import defaultConfig from './config/index.js';
import RulesEngine from './rules/index.js';

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
  .addHelpCommand('help [command]', 'Display help for command')
  .action(async (opts: { type?: string }) => {
    /*
      If the user has configured commitlint in the current working directory, attempt to load commitlint's config.
      We'll guide the user increating a commit message that adhere's to the commitlint config.
      Otherwise we'll use our default.
    */
    // by default pick some reasonable defaults
    const config = await load().catch(() => defaultConfig);

    // Create a new *git* instance scoped to the cwd
    const git = new Git();

    // Check if we're in a git repository first
    const isRepo = await git.isRepository();
    if (!isRepo) throw new Error('Not a git repository');

    const stagedFiles = await git.stagedFiles();
    console.log('\nStaged Files:');
    console.log('-------------');
    if (stagedFiles.length > 0) stagedFiles.forEach(file => console.log(file));
    else console.log('No files staged');

    const diff = await git.stagedDiff();
    if (diff) {
      console.log('\nStaged Changes:');
      console.log('--------------');
      console.log(diff);
    }

    const rulesEngine = RulesEngine.fromConfig(config.rules);

    const commit: CommitMessage = {
      type: await rulesEngine.narrow('type').prompt(opts.type),
      title: '<title>',
      scope: '<scope>',
      body: '<body>',
      breaking: false,
    };

    // const commitMessage = await promptCommitMessage();
    const formattedMessage = formatCommitMessage(commit);
    console.log('\nCommit message:');
    console.log('------------------------');
    console.log(formattedMessage.join('\n\n'));
    console.log('------------------------');

    // Then commit with this message.
    await git.commit(...formattedMessage);

    // In a real implementation, we might want to write this to a file
    // or pipe it to git commit, but for now we'll just display it
    process.exit(0);
  });

await program.parseAsync(process.argv);
