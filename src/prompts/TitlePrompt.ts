import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../rules/index.js';
import BasePrompt from './BasePrompt.js';

export default class TitlePrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'subject');
  }

  async generate(scope: string, diff: string, type: string) {
    const ai = this.AI.byPreference();

    const res = await ai
      .completion()
      .usecase('Coding')
      .prompt(
        'Generate an appropriate commit title to be included in the commit subject for the provided staged files.',
        "The commit's type and scope (if any) are shown below for context.",
        '## Subject',
        scope ? `${type}(${scope}): <title: goes here>` : `${type}: <title goes here>`,
        '## Git Diff',
        'Use the following git diff to determine a sensible title',
        '```txt',
        diff,
        '```',
      )
      // Force the output to be in JSON.
      .json('commit_title', { title: 'string' });

    if (res instanceof Error) throw res;
    return res.title;
  }

  async prompt(initialValue?: string): Promise<string> {
    let answer: string;

    if (this.rules.validate(initialValue)) answer = initialValue ?? '';
    else {
      const [enumRule] = this.rules.getRulesOfType('enum');

      answer = enumRule
        ? await select({ message: 'Choose a subject to commit as', choices: enumRule.value })
        : await input({
            message: 'Short title of why you are making this change:',
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
