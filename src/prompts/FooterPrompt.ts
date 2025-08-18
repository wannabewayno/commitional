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
        'Generate an appropriate commit footer (if any) to be appended to the body that relates to the provided staged files.',
        'The current commit message is shown for context',
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

    const { token, text } = await this.footerPrompt(selectedFooter.token, selectedFooter.text);

    commit.footer(token, text || null);
  }

  private async footerTokenPrompt(token?: string) {
    const trailerScope = this.rules.narrow('trailer').omit('exists', 'allow-multiple');
    const [trailerEnum] = trailerScope.getRulesOfType('enum');

    const commit = new CommitMessage();
    commit.setStyle(red, 'footers');

    // it would be good to validate this independently... 
    // We might need to come up iwth a different method for this, rules (knows about values) vs ruleengine (knows about commits) (invoke the rule many times...)
    // This might be cleaner actually...

    trailerEnum
      ? await select<string>({ message: 'Choose a subject to commit as:', choices: enumRule.value, default: _commit.subject })
      : await input({
          message: 'footer token:',
          default: token,
          prefill: 'editable',
          validate: value => {
            commit.footer(value, 'any');
            const [errors] = this.rules.validate(commit, 'fix');
            if (errors.length) {
              commit.style('subject');
              return errors.join('\n');
            }
            commit.unstyle('subject');
            return true;
          },
          transformer: () => _commit.subject,
        });
  }

  private async footerValuePrompt() {
    const [enumRule] = this.rules.getRulesOfType('enum');
    const _commit = commit.clone();
    _commit.setStyle(red, 'subject');

    enumRule
      ? await select<string>({ message: 'Choose a subject to commit as:', choices: enumRule.value, default: _commit.subject })
      : await input({
          message: 'If applied, this commit will...',
          default: _commit.subject,
          prefill: 'editable',
          validate: value => {
            _commit.subject = value;
            const [errors] = this.rules.validate(commit, 'fix');
            if (errors.length) {
              commit.style('subject');
              return errors.join('\n');
            }
            commit.unstyle('subject');
            return true;
          },
          transformer: () => _commit.subject,
        });
  }

  private async footerPrompt(token?: string, text?: string): Promise<{ token: string; text: string }> {
    const trailerScope = this.rules.narrow('trailer').omit('exists', 'allow-multiple');
    const [trailerEnum] = trailerScope.getRulesOfType('enum');

    // I would like the idea of filtering rules by their scope and type

    // This needs to only consider things that affect a single instance
    // I'll be able to have my cake and eat it too... 
    
    /*
      Footers
      | 'empty'
      | 'trim'
      | 'exclamation-mark'
      | 'full-stop'
      | 'max-length'
      | 'min-length'
      | 'max-line-length'
      | 'case'
      | 'enum'
      | 'leading-blank'
      | 'exists'

      | 'allow-multiple' (no)
      | 'exists' (only for 'never' rules)
    */

    // There's a common theme here. We need to filter out allow-multiple, exists, min, max these should not apply on the individual level.

    /*
      Trailer
      | 'empty'
      | 'trim'
      | 'exclamation-mark'
      | 'full-stop'
      | 'max-length'
      | 'min-length'
      | 'max-line-length'
      | 'case'
      | 'enum'
      | 'leading-blank'
      | 'exists'

      | 'allow-multiple' (no)
      | 'exists' (only for 'never' rules)
    */

    /*
      Footer
      | 'empty'
      | 'trim'
      | 'exclamation-mark'
      | 'full-stop'
      | 'max-length'
      | 'min-length'
      | 'max-line-length'
      | 'case'
      | 'enum' 
      | 'leading-blank' 

      | 'allow-multiple' (no)
      | 'exists' (only for 'never' rules)
    */

    // Max-length and max-line-length need to be merged with the footers-lenght and max-length

    // Footer Token
    if (!token) {
      token = trailerEnum
        ? await select<string>({ message: 'footer token:', choices: trailerEnum.value })
        : await input({
            message: 'footer token:',
            validate: value => {
              const [errors] = this.rules.validate(`${value}:`);
              if (errors.length) return errors.join('\n');
              return true;
            },
            transformer: value => {
              const [errors] = this.rules.validate(`${value}:`);
              return errors.length ? red(parsed) : parsed;
            },
          }).then(value => this.rules.validate(value)[0]);
    }

    const footerScope = this.rules.narrow('footer').omit('exists', 'allow-multiple');
    const [footerEnum] = footerScope.getRulesOfType('enum');

    // Footer Message
    const footerText = await input({
      message: '',
      default: text,
      prefill: 'editable',
      validate: value => {
        const [, errors] = this.rules.validate(`${token}: ${value}`);
        if (errors.length) return errors.join('\n');
        return true;
      },
      transformer: value => {
        const [parsed, errors] = this.rules.validate(`${token}: ${value}`);
        return errors.length ? red(parsed) : parsed;
      },
    }).then(value => this.rules.validate(`${token}: ${value}`)[0]);

    const [_token = '', _text = ''] = footerText.split(':').map(v => v.trim());

    return { token: _token, text: _text };
  }
}
