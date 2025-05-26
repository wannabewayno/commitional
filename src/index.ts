import { Command } from 'commander';
import load from '@commitlint/load';
import packageJSON from '../package.json' with { type: 'json' };
import { promptCommitMessage } from './prompts.js';
import { formatCommitMessage } from './lib/formatCommitMessage.js';
import Git from './services/Git/index.js';
import defaultConfig from './config/index.js';
import RuleEngine from './rules/index.js';
import { select, input } from '@inquirer/prompts';

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

    // load enum rules
    const typeRules = new RuleEngine('type', config.rules);
    if (opts.type) {
      // validate it
      typeRules.validate(opts.type);

      // If it's valid let it be
      console.log({ type: opts.type });

      // otherwise we need to prompt the user for it.
    } else {
      const enumRule = config.rules['type-enum'];
      const result = enumRule
        ? await select({ message: 'Select the type of change that you\'re committing:', choices: enumRule[2] ?? [] })
        : await input({
            message: 'Type of change that you\'re committing:',
            validate: (value) => typeRules.validate(value).valid,
            transformer: (value) => typeRules.parse(value),
          });
      console.log({ result });
    }

    // If we already have an input for the commit type - check it

    // If we don't then we need to prompt the user
    //  if we have an enum rule show a list of enums
    //  otherwise load all enum rules and vet it.


    const commitMessage = await promptCommitMessage();
    const formattedMessage = formatCommitMessage(commitMessage);
    console.log('\nCommit message:');
    console.log('------------------------');
    console.log(formattedMessage.join('\n\n'));
    await git.commit(...formattedMessage);
    console.log('------------------------');

    // In a real implementation, we might want to write this to a file
    // or pipe it to git commit, but for now we'll just display it
    process.exit(0);
  });

await program.parseAsync(process.argv);
