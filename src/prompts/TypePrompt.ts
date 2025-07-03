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
    const ai = this.AI.byPreference();

    const [enumRule] = this.rules.getRulesOfType('enum');
    const completion = ai
      .completion()
      .usecase('Coding')
      .system(
        'You are integrated into a cli that helps software engineers write meaningful git commits.',
        'You will be provided with the git diff of the currenty staged files to be committed asked to either generate a commit type, scope, title, or body.',
        'If previous parts of the commit message are known, these will also be provided for you.',
        'The following rules and guidelines must be adhered to.\n',
        await this.commitStandard(),
      );

    const res = await (enumRule
      ? completion
          .prompt(
            'From the list of provided commit types, select the appropriate commit type for the provided git diff of currently staged files to commit',
            '',
            '## Commit types',
            `${enumRule.value.join('\n')}`,
            '',
            '## Git Diff',
            '```txt',
            diff.toString(),
            '```',
          )
          // Force the output to be in JSON.
          .json('commit_type', { type: toEnum(enumRule.value) })
      : completion
          .prompt(
            'From the list of provided commit types, select the appropriate commit type for the provided git diff of currently staged files to commit',
            '',
            '## Git Diff',
            '```txt',
            diff.toString(),
            '```',
          )
          // Force the output to be in JSON.
          .json('commit_type', { type: 'string' }));

    if (res instanceof Error) throw res;

    // set the commit's type
    commit.type = res.type;
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
            const valid = this.rules.validate(value);
            if (!valid) return this.rules.check(value).flat().join('\n');
            return true;
          },
          transformer: value => {
            value = this.rules.parse(value);
            if (!this.rules.validate(value)) value = red(value);
            return value;
          },
        });

    commit.type = this.rules.parse(answer);
  }
}
