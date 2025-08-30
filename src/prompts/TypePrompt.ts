import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../RulesEngine/index.js';
// import toEnum from '../lib/toEnum.js';
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

    commit.type = await completion.text(type => {
      const [fixed, errors] = this.rules.validate(type);

      if (errors.length) return new Error(errors.join('\n'));

      return fixed;
    });
  }

  async prompt(commit: CommitMessage): Promise<void> {
    const scope = this.rules.omit('exists', 'allow-multiple');
    const [enumRule] = scope.getRulesOfType('enum');

    const [validType] = enumRule
      ? await select<string>({
          message: "Select the type of change that you're committing:",
          choices: enumRule.value,
          default: commit.type,
        }).then(v => [v])
      : await input({
          message: "Type of change that you're committing:",
          default: commit.type,
          prefill: 'editable',
          validate: value => {
            const [, errors] = scope.validate(value);
            if (errors.length) return errors.join('\n');
            return true;
          },
          transformer: value => {
            const [fixed, errors] = scope.validate(value);
            if (!fixed) return '';
            return errors.length ? red(fixed) : fixed;
          },
        }).then(answer => scope.validate(answer));

    commit.type = validType;
  }
}
