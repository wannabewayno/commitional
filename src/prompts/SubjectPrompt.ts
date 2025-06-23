import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../RulesEngine/index.js';
import BasePrompt from './BasePrompt.js';
import type Diff from '../services/Git/Diff.js';
import { red } from 'yoctocolors';
import type CommitMessage from '../CommitMessage/index.js';

export default class SubjectPrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'subject');
  }

  async generate(diff: Diff, commit: CommitMessage) {
    const ai = this.AI.byPreference();

    const res = await ai
      .completion()
      .usecase('Coding')
      .system(
        'You are integrated into a cli that helps software engineers write meaningful git commits.',
        'You will be provided with the git diff of the currenty staged files to be committed asked to either generate a commit type, scope, title, or body.',
        'If previous parts of the commit message are known, these will also be provided for you.',
        'The following rules and guidelines must be adhered to.\n',
        await this.commitStandard(),
      )
      .prompt(
        'Generate an appropriate commit title to be included in the commit subject for the provided staged files.',
        'The partial commit header is shown for context',
        '## Commit Header',
        commit.header,
        '## Git Diff',
        'Use the following git diff to determine a sensible title',
        '```txt',
        diff.toString(),
        '```',
      )
      // Force the output to be in JSON.
      .json('commit_subject', { subject: 'string' });

    if (res instanceof Error) throw res;

    // set the commit's subject
    commit.subject = res.subject;
  }

  async prompt(initialValue?: string): Promise<string> {
    const [enumRule] = this.rules.getRulesOfType('enum');

    const answer = enumRule
      ? await select<string>({ message: 'Choose a subject to commit as', choices: enumRule.value, default: initialValue })
      : await input({
          message: 'If applied, this commit will...',
          default: initialValue,
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
