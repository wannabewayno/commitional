import { Command } from 'commander';
import { lintCmd, createCmd } from './Commands/index.js';

process.on('uncaughtException', error => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    console.log('👋 bye!');
  } else {
    // Rethrow unknown errors Log errors to the console and exit with a non-zero exit code
    console.log(error.message);
    process.exit(1);
  }
});

const program = new Command();

program
  .name('commitional')
  .description('CLI tool for crafting, formatting and linting commit messages - compatible with commitlint')
  .version(process.env.VERSION ?? 'dev', '-v, --version', 'Output the current version')
  .addHelpCommand('help [command]', 'Display help for command');

program.addCommand(createCmd, { isDefault: true });
program.addCommand(lintCmd);

await program.parseAsync(process.argv);
