import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../RulesEngine/index.js';
// import toEnum from '../lib/toEnum.js';
import BasePrompt from './BasePrompt.js';
import type Diff from '../services/Git/Diff.js';
import { red } from 'yoctocolors';
import CommitMessage from '../CommitMessage/index.js';

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

      const blankCommit = new CommitMessage();
      blankCommit.type = type;

      const [errors] = this.rules.validate(blankCommit);

      if (errors.length) return new Error(errors.join('\n'));

      return type;
    });
  }

  async prompt(commit: CommitMessage): Promise<void> {
    const [enumRule] = this.rules.getRulesOfType('enum');
    const _commit = commit.clone();
    _commit.setStyle(red, 'type');

    enumRule
      ? await select<string>({
          message: "Select the type of change that you're committing:",
          choices: enumRule.value,
          default: _commit.type,
        })
      : await input({
          message: "Type of change that you're committing:",
          default: _commit.type,
          prefill: 'editable',
          validate: value => {
            _commit.type = value;
            const [errors] = this.rules.validate(_commit);
            if (errors.length) {
              _commit.style('type');
              return errors.join('\n');
            }
            _commit.unstyle('type');
            return true;
          },
          transformer: () => _commit.type,
        });

    commit.type = _commit.type;
  }
}
