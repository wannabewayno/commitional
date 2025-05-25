import { input, confirm, select } from '@inquirer/prompts';

const COMMIT_TYPES = [
  { name: 'feat: A new feature', value: 'feat' },
  { name: 'fix: A bug fix', value: 'fix' },
  { name: 'docs: Documentation only changes', value: 'docs' },
  { name: 'style: Changes that do not affect the meaning of the code', value: 'style' },
  { name: 'refactor: A code change that neither fixes a bug nor adds a feature', value: 'refactor' },
  { name: 'perf: A code change that improves performance', value: 'perf' },
  { name: 'test: Adding missing tests or correcting existing tests', value: 'test' },
  { name: 'build: Changes that affect the build system or external dependencies', value: 'build' },
  { name: 'ci: Changes to our CI configuration files and scripts', value: 'ci' },
  { name: "chore: Other changes that don't modify src or test files", value: 'chore' },
];

export interface CommitMessage {
  type: string;
  title: string;
  scope?: string;
  body: string;
  breaking: boolean;
}

export async function promptCommitMessage(): Promise<CommitMessage> {
  return {
    type: await select({
      message: "Select the type of change you're committing:",
      choices: COMMIT_TYPES,
      pageSize: 10,
    }),
    title: await input({
      message: 'Write a short description of the change:',
      validate: (input: string) => {
        if (input.length === 0) return 'Subject is required';
        if (input.length > 100) return 'Subject must be 100 characters or less';
        if (input[0].toUpperCase() !== input[0]) return 'Subject must start with a capital letter';
        if (input.endsWith('.')) return 'Subject should not end with a period';
        return true;
      },
    }),
    body: await confirm({
      message: 'Would you like to add a longer description?',
      default: false,
    }).then(v => {
      if (!v) return '';
      return input({
        message: 'Enter a longer description of the changes (optional):',
        validate: (input: string) => {
          if (input.split('\n').some(line => line.length > 100)) return 'Body lines must wrap at 100 characters';
          return true;
        },
      });
    }),
    breaking: await confirm({ message: 'Are there any breaking changes?', default: false }),
  };
}
