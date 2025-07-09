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

  async prompt(commit: CommitMessage, filter?: string): Promise<void> {
    const selectedFooter = commit.footer(filter ?? '') || { token: undefined, text: undefined };

    const { token, text } = await this.footerPrompt(selectedFooter.token, selectedFooter.text);

    commit.footer(token, text || null);
  }

  private async footerPrompt(token?: string, text?: string): Promise<{ token: string; text: string }> {
    // This shouldn't have an enum rule? or should it for the footer token
    const [enumRule] = this.rules.getRulesOfType('enum');

    // Footer Token
    if (!token) {
      token = enumRule
        ? await select<string>({ message: 'select token:', choices: enumRule.value })
        : await input({
            message: 'footer token:',
            validate: value => {
              const footerText = `${value}:`;
              const valid = this.rules.validate(footerText);
              if (!valid) return this.rules.check(footerText).join('\n');
              return true;
            },
            transformer: value => {
              value = this.rules.parse(`${value}:`);
              if (!this.rules.validate(value)) value = red(value);
              return value;
            },
          }).then(value => this.rules.parse(value));
    }

    // Footer Message
    const footerText = await input({
      message: '',
      default: text,
      prefill: 'editable',
      validate: value => {
        const footerText = `${token}: ${value}`;
        const valid = this.rules.validate(footerText);
        if (!valid) return this.rules.check(footerText).join('\n');
        return true;
      },
      transformer: value => {
        value = this.rules.parse(`${token}: ${value}`);
        if (!this.rules.validate(value)) value = red(value);
        return value;
      },
    }).then(value => this.rules.parse(`${token}: ${value}`));

    const [_token = '', _text = ''] = footerText.split(':').map(v => v.trim());

    return { token: _token, text: _text };
  }
}
