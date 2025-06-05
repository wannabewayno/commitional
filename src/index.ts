import { Command } from 'commander';
import packageJSON from '../package.json' with { type: 'json' };
import { formatCommitMessage } from './lib/formatCommitMessage.js';
import Git from './services/Git/index.js';
import RulesEngine from './rules/index.js';
import { ScopeDeducer } from './services/ScopeDeducer/index.js';
import loadConfig from './config/index.js';
import { TypePrompt, ScopePrompt, TitlePrompt, BodyPrompt } from './prompts/index.js';
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
  .option('-t, --title <title>', 'Commit subject')
  .option('-b, --body <body>', 'Commit body')
  .option('-B, --breaking', 'Is this a Breaking change?')
  .option('-A, --auto', 'Use Generative AI to pre-fill your commit message', false)
  .addHelpCommand('help [command]', 'Display help for command')
  .action(
    async (opts: { type?: string; scope?: string; title?: string; breaking?: boolean; body?: string; auto: boolean }) => {
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

      const typePrompt = new TypePrompt(rulesEngine);
      if (opts.auto) opts.type = await typePrompt.generate(scope, diff);
      const type = await typePrompt.prompt(opts.type);

      const titlePrompt = new TitlePrompt(rulesEngine);
      if (opts.auto) opts.title = await titlePrompt.generate(scope, diff, type);
      const title = await titlePrompt.prompt(opts.title);

      const body = await new BodyPrompt(rulesEngine).prompt(opts.body);

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

      process.exit(0);
    },
  );

await program.parseAsync(process.argv);
