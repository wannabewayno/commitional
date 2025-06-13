import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../RulesEngine/index.js';
import BasePrompt from './BasePrompt.js';
import type { CommitMessage } from './index.js';
import type Diff from '../services/Git/Diff.js';
import { red } from 'yoctocolors';

export default class SubjectPrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'subject');
  }

  async generate(diff: Diff, { type, scope }: Partial<CommitMessage>) {
    const ai = this.AI.byPreference();

    const res = await ai
      .completion()
      .usecase('Coding')
      .system(
        'You are integrated into a cli that helps software engineers write meaningful git commits.',
        'You will be provided with the git diff of the currenty staged files to be committed asked to either generate a commit type, scope, title, or body.',
        'If previous parts of the commit message are known, these will also be provided for you.',
        'The following rules and guidelines must be adhered to.\n',
        this.commitStandard(),
      )
      .prompt(
        'Generate an appropriate commit title to be included in the commit subject for the provided staged files.',
        "The commit's type and scope (if any) are shown below for context.",
        '## Subject',
        scope ? `${type}(${scope}): <title: goes here>` : `${type}: <title goes here>`,
        '## Git Diff',
        'Use the following git diff to determine a sensible title',
        '```txt',
        diff.toString(),
        '```',
      )
      // Force the output to be in JSON.
      .json('commit_title', { title: 'string' });

    if (res instanceof Error) throw res;
    return res.title;
  }

  async prompt(): Promise<string> {
    const [enumRule] = this.rules.getRulesOfType('enum');

    const answer = enumRule
      ? await select<string>({ message: 'Choose a subject to commit as', choices: enumRule.value })
      : await input({
          message: 'Short title of why you are making this change:',
          validate: value => {
            const valid = this.rules.validate(value);
            if (!valid) return this.rules.check(value).join('\n');
            return true;
          },
          transformer: value => {
            value = this.rules.parse(value);
            if (!this.rules.validate(value)) value = red(value);
            return value;
          },
        });

    return this.rules.parse(answer);
  }
}
