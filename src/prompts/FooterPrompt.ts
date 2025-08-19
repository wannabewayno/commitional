import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../RulesEngine/index.js';
import BasePrompt from './BasePrompt.js';
import type Diff from '../services/Git/Diff.js';
import { red } from 'yoctocolors';
import CommitMessage from '../CommitMessage/index.js';

export default class FooterPrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'footers', 'trailer', 'footer');
  }

  async generate(diff: Diff, commit: CommitMessage) {

    const completion = await this.createAiCompletion().then(completion => completion.user(
        '## Task',
        'Analyse the currently staged changes to be committed and the current commit message.',
        'If approrpiate, generate appropriate commit footer(s) (if any) to be appended to the body that would complement the existing commit message.',
        '',
        '## Current commit message',
        '```txt',
        commit.toString(),
        '```',
        '',
        '## Git Diff',
        'Use the following git diff to determine a sensible footer (if any)',
        '```txt',
        diff.toString(),
        '```',

        '## IMPORTANT',
        '*Silence is golden*, commits should be clear and succint, if adding a footer is superfluous, refrain from doing so.'
      )
    )

    const footer = await completion.json(
      'commit_footer',
      { token: 'string', content: 'string' },
      (input) => {
        const commit = new CommitMessage();
        commit.footer(token, content);

        const [errors] = this.rules.validate(commit, 'fix');
        if (errors.length) return new Error(errors.join('\n'));

        return input;
      }
    );

    const { token, content } = footer;

    // set a footer on the commit
    commit.footer(token, content);
  }

  async prompt(commit: CommitMessage, filter?: string): Promise<void> {
    const selectedFooter = commit.footer(filter ?? '') || { token: undefined, text: undefined };

    const token = await this.footerTokenPrompt(selectedFooter.token);
    const text = await this.footerValuePrompt(token, selectedFooter.text);

    commit.footer(token, text || null);
  }

  private async footerTokenPrompt(token?: string) {
    const scope = this.rules.narrow('trailer').omit('exists', 'allow-multiple');
    const [enumRule] = scope.getRulesOfType('enum');

    const [validatedToken] = enumRule
      ? await select<string>({ message: 'Choose a subject to commit as:', choices: enumRule.value, default: token }).then(value => [value])
      : await input({
          message: 'footer token:',
          default: token,
          prefill: 'editable',
          validate: value => {
            const [, errors] = scope.validate(value);
            if (errors.length) return errors.join('\n');
            return true;
          },
          transformer: (value) => {
            const [fixed, errors] = scope.validate(value);
            if (!fixed) return '';
            return errors.length ? red(fixed) : fixed;
          },
        }).then(scope.validate);

    return validatedToken;
  }

  private async footerValuePrompt(token: string, footer?: string) {
    const scope = this.rules.narrow('footer').omit('exists', 'allow-multiple');
    const [enumRule] = scope.getRulesOfType('enum');

    const [validatedFooter] = enumRule
      ? await select<string>({ message: 'Choose a subject to commit as:', choices: enumRule.value, default: footer }).then(value => [value])
      : await input({
          message: `${token}:`,
          default: footer,
          prefill: 'editable',
          validate: value => {
            const [, errors] = scope.validate([value]);
            if (errors.length) return errors.join('\n');
            return true;
          },
          transformer: (value) => {
            const [[fixed], errors] = scope.validate([value]);
            if (!fixed) return '';
            return errors.length ? red(fixed) : fixed;
          },
        }).then(scope.validate);
    
    return validatedFooter;
  }
}
