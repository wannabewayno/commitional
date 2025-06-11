import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../rules/index.js';
import toEnum from '../lib/toEnum.js';
import BasePrompt from './BasePrompt.js';
import type Diff from '../services/Git/Diff.js';

export default class TypePrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'type');
  }

  async generate(diff: Diff) {
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
        this.commitStandard(),
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
    return res.type;
  }

  async prompt(initialValue?: string): Promise<string> {
    let answer: string;

    if (this.rules.validate(initialValue)) answer = initialValue as string;
    else {
      const [enumRule] = this.rules.getRulesOfType('enum');
      console.log('Type enum rule:', enumRule);

      answer = enumRule
        ? await select({ message: "Select the type of change that you're committing:", choices: enumRule.value })
        : await input({
            message: "Type of change that you're committing:",
            validate: value => {
              const valid = this.rules.validate(value);
              if (!valid) return this.rules.check(value).join('\n');
              return true;
            },
            transformer: value => this.rules.parse(value),
          });
    }

    return this.rules.parse(answer);
  }
}
