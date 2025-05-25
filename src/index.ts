#!/usr/bin/env node

import { Command } from 'commander';
import packageJSON from '../package.json' with { type: 'json' };
import { promptCommitMessage } from './prompts.js';
import { formatCommitMessage } from './lib/formatCommitMessage.js';
import Git from './services/Git/index.js';

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
  .addHelpCommand('help [command]', 'Display help for command');

// Set up the default action when no command is provided
program.action(async () => {
  const git = new Git();
  // Check if we're in a git repository first
  const isRepo = await git.isRepository();
  if (!isRepo) {
    console.error('Error: Not in a Git repository');
    process.exit(1);
  }

  if (isRepo) {
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
  }

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
