import { Command } from 'commander';
import { default as lint } from './lint.js';
import { default as create } from './create.js';

/**
 * Lint command
 * Usage: commitional lint <path/to/commitmsg|hash|hash...range|integer> [--fix]
 */
export const lintCmd = new Command('lint')
  .description(
    'The lint subcommand will lint commits from file or from git log (see args) and log errors to stdout using the configured linting rules',
  )
  .argument(
    '<path/to/commitmsg|hash|hash...range|integer>',
    'The filepath to a commit msg, a commit hash, hash...range or an integer representing the number of commits from the current head to lint',
  )
  .option(
    '-f, --fix',
    'Enable fix mode, this is the default when interactively editing a commit, but opt-in here; will attempt to fix commits by augmenting their content to match the rules, if the commit is provided as a filepath, will write back the fixed commit to this location',
    false,
  )
  .action(lint());

export const createCmd = new Command('create')
  .description('The create subcommand will create a new commit message interactively')
  .option('-e, --edit', 'Edit the commit message in an editor', false)
  .option('-t, --type [type]', 'Commit type (feat, fix, test, ...)')
  .option('-S, --scope [scope]', 'Commit scope (if any)')
  .option('-s, --subject [subject]', 'Commit subject')
  .option('-b, --body [body]', 'Commit body')
  .option('-f, --footer [footer...]', 'Commit footer(s)')
  .option('-B, --breaking', 'Mark the commit as a breaking change')
  .option('-P, --no-breaking', 'Mark the commit as a non breaking change')
  .option('-A, --auto', 'Use Generative AI to pre-fill your commit message', false)
  .action(create());
