import { Command } from 'commander';
import packageJSON from '../package.json' with { type: 'json' };
import { formatCommitMessage } from './lib/formatCommitMessage.js';
import Git from './services/Git/index.js';
import RulesEngine from './rules/index.js';
import { ScopeDeducer } from './services/ScopeDeducer/index.js';
import loadConfig from './config/index.js';
import { TypePrompt, ScopePrompt, SubjectPrompt } from './prompts/index.js';
import { confirm } from '@inquirer/prompts';

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
  .option('-s, --scope <scope>', 'Commit scope (if any)')
  .option('-S, --subject <subject>', 'Commit subject')
  .option('-b, --body <body>', 'Commit body')
  .option('-B, --breaking', 'Is this a Breaking change?')
  .addHelpCommand('help [command]', 'Display help for command')
  .action(async (opts: { type?: string; scope?: string; subject?: string; breaking?: boolean; body?: string }) => {
    /*
      If the user has configured commitlint in the current working directory, attempt to load commitlint's config.
      We'll guide the user increating a commit message that adhere's to the commitlint config.
      Otherwise we'll use our default.
    */
    // by default pick some reasonable defaults
    const config = await loadConfig();

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

    const scopeDeducer = ScopeDeducer.fromRulesEngine(rulesEngine);

    // Deduce scope from staged files
    const deducedScope = scopeDeducer.deduceScope(stagedFiles) ?? (opts.scope ? opts.scope.split(',') : []);
    const scope = await new ScopePrompt(rulesEngine).prompt(deducedScope.join(','));

    // I should keep it simple and do the AI stuff here and just pass it in to the validator.
    const type = await new TypePrompt(rulesEngine).prompt(opts.type);

    const title = await new SubjectPrompt(rulesEngine).prompt(opts.subject);
    const body = '<body>';
    const breaking =
      opts.breaking !== undefined
        ? opts.breaking
        : await confirm({ message: 'Does this change introduce any breaking changes?' });

    // const commitMessage = await promptCommitMessage();
    const formattedMessage = formatCommitMessage({
      type,
      title,
      body,
      breaking,
      scope,
    });
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
