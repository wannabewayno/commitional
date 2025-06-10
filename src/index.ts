import { Command } from 'commander';
import packageJSON from '../package.json' with { type: 'json' };
import { formatCommitMessage } from './lib/formatCommitMessage.js';
import Git from './services/Git/index.js';
import RulesEngine from './rules/index.js';
import { ScopeDeducer } from './services/ScopeDeducer/index.js';
import loadConfig from './config/index.js';
import { TypePrompt, ScopePrompt, TitlePrompt, BodyPrompt } from './prompts/index.js';
import { confirm } from '@inquirer/prompts';
import { blue, green, red } from 'yoctocolors';
import ora, { oraPromise } from 'ora';
import { commitSubject } from './lib/formatCommitBody.js';
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

const Break = Symbol('break');

type ChainOptions = {
  // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
  [x: string]: typeof Break | (() => typeof Break | void) | (() => Promise<typeof Break | void>);
};

class PromptFlow {
  constructor(
    private readonly message: string,
    private readonly options: ChainOptions,
    private readonly config?: Omit<SelectWithBannerConfig<string | number>, 'message' | 'choices'>,
  ) {
    // convert into array of choices
    // Potentially we need to pass an array of options... so we can have separators and sheeeit

    // if there's no break condition, we need to throw an error otherwise when running this, it will be an infinite loop
    if (!Object.values(options).some(v => v === Break))
      throw new Error('No break condition, will result in an infinite prompt loop');
  }

  async prompt(): Promise<void> {
    const answer = await select<keyof typeof this.options>({
      message: this.message,
      choices: Object.keys(this.options) as string[],
      ...this.config,
    });

    const handler = this.options[answer];
    const value = typeof handler === 'function' ? await Promise.resolve(handler()) : handler;

    if (value === Break) return;
    return this.prompt();
  }
}

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
        We'll guide the user in creating a commit message that adheres to the commitlint config.
        Otherwise it'll load a default config.
      */
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
      else {
        console.log(red('No files staged to commit'));
        return;
      }

      const diff = await git.stagedDiff();

      const rulesEngine = RulesEngine.fromConfig(config.rules);

      const scopeDeducer = ScopeDeducer.fromRulesEngine(rulesEngine);

      // Deduce scope from staged files
      const deducedScope = scopeDeducer.deduceScope(stagedFiles) ?? (opts.scope ? opts.scope.split(',') : []);
      const scope = await new ScopePrompt(rulesEngine).prompt(deducedScope.join(','));

      const typePrompt = new TypePrompt(rulesEngine);
      if (opts.auto) {
        opts.type = await oraPromise(typePrompt.generate(scope, diff), {
          text: `Generating ${commitSubject({ type: green('<type>'), scope, title: '<title>', breaking: false })}`,
          successText: type => `${commitSubject({ type, scope, title: '<title>', breaking: false })}`,
        });
      }
      const type = await typePrompt.prompt(opts.type);

      const titlePrompt = new TitlePrompt(rulesEngine);
      if (opts.auto) {
        opts.title = await oraPromise(titlePrompt.generate(scope, diff, type), {
          text: `Generating ${commitSubject({ type, scope, title: green('<title>'), breaking: false })}`,
          successText: title => `${commitSubject({ type, scope, title, breaking: false })}`,
        });
      }
      const title = await titlePrompt.prompt(opts.title);

      const bodyPrompt = await new BodyPrompt(rulesEngine);
      if (opts.auto) {
        opts.body = await oraPromise(bodyPrompt.generate(scope, diff, type, title), {
          text: 'Generating commit body...',
          successText: body => truncate(body.split('\n')[0], 75),
        });
      }
      const body = await bodyPrompt.prompt(opts.body);

      const breaking =
        opts.breaking !== undefined
          ? opts.breaking
          : await confirm({ message: 'Does this change introduce any breaking changes?' });

      const [Subject, Body] = formatCommitMessage({
        type,
        title,
        body,
        breaking,
        scope,
      });

      await new PromptFlow(
        'Commit or Edit',
        {
          Commit: Break,
          type: () => console.log('type!'),
          scope: () => console.log('scope!'),
          title: () => console.log('title!'),
          body: () => console.log('body!'),
          breaking: () => console.log('breaking!'),
        },
        {
          banner: choice => {
            const [Subject, Body] = formatCommitMessage({
              type: choice.value === 'type' ? `${red('>')}${green(type)}${red('<')}` : type,
              title: choice.value === 'title' ? `${red('>')}${green(title)}${red('<')}` : title,
              body: choice.value === 'body' ? `${red('>')}${green(body)}${red('<')}` : body,
              breaking,
              scope: choice.value === 'scope' ? `${red('>')}${scope ? green(scope) : blue('scope')}${red('<')}` : scope,
            });

            return `\n----------------------------------------\n${Subject}\n\n${Body}`;
          },
        },
      ).prompt();

      const spinner = ora('Commiting...').start();
      const res = await git.commit(Subject, Body);
      if (res.success) spinner.succeed(res.commitHash);
      else spinner.fail(res.error?.message);
    },
  );

await program.parseAsync(process.argv);
