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
    const completion = await this.createAiCompletion().then(completion =>
      completion.user(
        'Generate an appropriate commit title to be included in the commit subject for the provided staged files.',
        'The partial commit header is shown for context',
        '## Commit Header',
        commit.header,
        '## Git Diff',
        'Use the following git diff to determine a sensible title',
        '```txt',
        diff.toString(),
        '```',
      ),
    );

    // set the commit's subject
    commit.subject = await completion.text();
  }

  async prompt(commit: CommitMessage): Promise<void> {
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

    commit.subject = _commit.subject
  }
}
