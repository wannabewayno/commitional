import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../RulesEngine/index.js';
import toEnum from '../lib/toEnum.js';
import BasePrompt from './BasePrompt.js';
import type Diff from '../services/Git/Diff.js';
import { red } from 'yoctocolors';
import type CommitMessage from '../CommitMessage/index.js';

export default class TypePrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'type');
  }

  async generate(diff: Diff, commit: CommitMessage) {
    const [enumRule] = this.rules.getRulesOfType('enum');

    const baseCompletion = await this.createAiCompletion();

    const task = enumRule
      ? [
          'From the list of provided commit types, select the appropriate commit type for the provided git diff of currently staged files to commit',
          '',
          '### Commit types',
          `${enumRule.value.join('\n')}`,
        ].join('\n')
      : 'Whilst respecting the general rules, identify a commit type for the provided git diff of currently staged files that we want to commit';

    const completion = baseCompletion.user(
      '## Task',
      task,
      '',
      '## General Rules',
      this.rules.generalRules(),
      '',
      '## Git Diff',
      '```txt',
      diff.toString(),
      '```',
    );

    commit.type = await this.tryAiCompletion(completion, enumRule ? toEnum(enumRule.value) : 'string');
  }

  async prompt(commit: CommitMessage): Promise<void> {
    const [enumRule] = this.rules.getRulesOfType('enum');
    const initialValue = commit.type;

    const answer = enumRule
      ? await select<string>({
          message: "Select the type of change that you're committing:",
          choices: enumRule.value,
          default: initialValue,
        })
      : await input({
          message: "Type of change that you're committing:",
          default: initialValue,
          prefill: 'editable',
          validate: value => {
            const [, errors] = this.rules.parse(value);
            if (errors.length) return errors.join('\n');
            return true;
          },
          transformer: value => {
            const [parsed, errors] = this.rules.parse(value);
            return errors.length ? red(value) : parsed;
          },
        });

    commit.type = this.rules.parse(answer)[0];
  }
}
