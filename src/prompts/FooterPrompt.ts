import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../RulesEngine/index.js';
import BasePrompt from './BasePrompt.js';
import type Diff from '../services/Git/Diff.js';
import { red } from 'yoctocolors';
import type CommitMessage from '../CommitMessage/index.js';

export default class FooterPrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'footer');
  }

  async generate(diff: Diff, commit: CommitMessage) {
    const ai = this.AI.byPreference();

    const res = await ai
      .completion()
      .usecase('Coding')
      .system(
        'You are integrated into a cli that helps software engineers write meaningful git commits.',
        'You will be provided with the git diff of the currenty staged files to be committed and asked to either generate a commit type, scope, title, body or footer(s).',
        'If previous parts of the commit message are known, these will also be provided to you.',
        'The following rules and guidelines must be adhered to.\n',
        await this.commitStandard(),
      )
      .prompt(
        'Generate an appropriate commit footer (if any) to be appended to the body that relates to the provided staged files.',
        'The current commit is shown for context',
        '## Current Partial Commit',
        '```txt',
        commit.toString(),
        '```',
        '## Git Diff',
        'Use the following git diff to determine a sensible footer (if any)',
        '```txt',
        diff.toString(),
        '```',
      )
      // Force the output to be in JSON.
      .json('commit_footer', { token: 'string', content: 'string' });

    if (res instanceof Error) throw res;

    // set the commit's subject
    commit.footer(res.token, res.content);
  }

  async prompt(initialValue?: string): Promise<string> {
    const [initialToken, initialMessage] = (initialValue ? initialValue.split(':') : []).map(v => v.trim());

    // This shouldn't have an enum rule? or should it for the footer token
    const [enumRule] = this.rules.getRulesOfType('enum');

    // Footer Token
    const token = initialToken
      ? initialToken
      : enumRule
        ? await select<string>({ message: 'select token:', choices: enumRule.value, default: initialToken })
        : await input({
            message: 'footer token:',
            default: initialToken,
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
          }).then(token => this.rules.parse(token));

    // Footer Message
    return input({
      message: `${token}: `,
      default: initialMessage,
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
    }).then(footer => this.rules.parse(`${token}:${footer}`));
  }
}
