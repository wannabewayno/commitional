import type CommitMessage from '../CommitMessage/index.js';
import type RulesEngine from '../RulesEngine/index.js';
import type { CommitPart } from '../RulesEngine/index.js';
import type { ICompletion } from '../services/AI/Completion/index.js';
import AIProvider from '../services/AI/index.js';
import type Diff from '../services/Git/Diff.js';
import { generalRules, bodyGuidelines, subjectAndBodyGuidelines, usingImperativeMood } from './commit-message-standard.js';

export default abstract class BasePrompt {
  protected AI = AIProvider();
  protected rules: RulesEngine;

  constructor(
    rules: RulesEngine,
    private readonly type: CommitPart,
  ) {
    this.rules = rules.narrow(type);
  }

  protected commitStandard(): string {
    return [generalRules, subjectAndBodyGuidelines, usingImperativeMood, bodyGuidelines].join('\n\n');
  }

  /**
   * Prompt the user to provide a value for the defined part of the commit message.
   * @param initialValue
   */
  abstract prompt(commit: CommitMessage, filter?: string): Promise<void>;

  /**
   * Validate the initial value (if any) and if required prompt the user.
   * @param initialValue
   */
  async promptIfInvalid(commit: CommitMessage): Promise<void> {
    if (this.type === 'footer') {
      // it gets harder for array types, especially since there's no good design pattern for this.
      for (const footer of commit.footers) {
        const [token = '', text = ''] = footer.split(':').map(v => v.trim());
        if (this.rules.validate(footer)) commit.footer(token, text);
        else await this.prompt(commit, token);
      }
    } else {
      const initialValue = commit[this.type];
      if (this.rules.validate(initialValue)) commit[this.type] = this.rules.parse(initialValue)[0];
      else await this.prompt(commit);
    }
  }

  /**
   * Generate a part of the commit message based on the diff and the parts of the commit message that may be available so far.
   * @param diff
   * @param commit
   */
  abstract generate(diff: Diff, commit: CommitMessage): Promise<void>;

  protected async createAiCompletion() {
    const ai = this.AI.byPreference();
    return ai
      .completion()
      .usecase('Coding')
      .system(
        'You are integrated into a cli that helps software engineers write meaningful git commits.',
        'You will be provided with the git diff of the currenty staged files to be committed asked to either generate a commit type, scope, title, or body.',
        'If previous parts of the commit message are known, these will also be provided for you.',
        'The following rules and guidelines must be adhered to.\n',
        await this.commitStandard(),
      );
  }

  protected async tryAiCompletion(completion: ICompletion, jsonSchema: 'string' | `"${string}"`): Promise<string> {
    const maxAttempts = 3;
    let attempts = 0;
    const schemaName = `commit_${this.type}`;

    while (attempts < maxAttempts) {
      const res = await completion.json(schemaName, { value: jsonSchema });

      if (res instanceof Error) continue;

      const [parsed, errors] = this.rules.parse(res.value as string);

      if (!errors.length) return parsed;

      attempts++;

      if (attempts >= maxAttempts) return parsed;

      completion.assistant(JSON.stringify(res, null, 2));

      completion.user(
        `The previous response was not a valid ${this.type}. Please fix the response and try again.`,
        '## Errors',
        errors.join('\n'),
      );
    }

    return '';
  }
}
