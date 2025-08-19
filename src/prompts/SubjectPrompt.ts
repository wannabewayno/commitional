import { input } from '@inquirer/prompts';
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

    // Set the commit's subject
    commit.subject = await completion.text();
  }

  async prompt(commit: CommitMessage): Promise<void> {
    const scope = this.rules.omit('exists', 'allow-multiple');

    const [validSubject] = await input({
      message: 'If applied, this commit will...',
      default: commit.subject,
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

    commit.subject = validSubject;
    scope.validate(commit);
  }
}
