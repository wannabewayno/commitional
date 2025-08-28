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
    const contextLines = [
      'Generate an appropriate commit subject (title) for the provided staged files.',
      'Do NOT include the commit type prefix (like "feat:", "fix:", etc.) in your response.',
      'Only provide the descriptive subject text that comes after the colon.',
    ];

    if (commit.type) contextLines.push(`The commit type is: ${commit.type}`);
    if (commit.scope) contextLines.push(`The commit scope is: ${commit.scope}`);

    contextLines.push(
      '## Git Diff',
      'Use the following git diff to determine a sensible subject:',
      '```txt',
      diff.toString(),
      '```',
    );

    const completion = await this.createAiCompletion().then(completion => completion.user(...contextLines));

    // Set the commit's subject, ensuring no type prefix is included
    const generatedSubject = await completion.text();
    commit.subject = generatedSubject.replace(/^\w+:\s*/, ''); // Strip any accidental type prefix
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
      transformer: value => {
        const [fixed, errors] = scope.validate(value);
        if (!fixed) return '';
        return errors.length ? red(fixed) : fixed;
      },
    }).then(answer => scope.validate(answer));

    commit.subject = validSubject;
  }
}
