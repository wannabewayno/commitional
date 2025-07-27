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
    commit.subject = await this.tryAiCompletion(completion);
  }

  async prompt(commit: CommitMessage): Promise<void> {
    const [enumRule] = this.rules.getRulesOfType('enum');
    const initialValue = commit.subject;

    const answer = enumRule
      ? await select<string>({ message: 'Choose a subject to commit as', choices: enumRule.value, default: initialValue })
      : await input({
          message: 'If applied, this commit will...',
          default: initialValue,
          prefill: 'editable',
          validate: value => {
            const [, errors] = this.rules.parse(value);
            if (errors.length) return errors.join('\n');
            return true;
          },
          transformer: value => {
            const [parsed, errors] = this.rules.parse(value);
            return errors.length ? red(value) : parsed;
          },
        });

    commit.subject = this.rules.parse(answer)[0];
  }
}
