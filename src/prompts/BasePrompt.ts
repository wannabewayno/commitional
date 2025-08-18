import type CommitMessage from '../CommitMessage/index.js';
import type RulesEngine from '../RulesEngine/index.js';
import type { RuleScope } from '../RulesEngine/index.js';
import AIProvider from '../services/AI/index.js';
import type Diff from '../services/Git/Diff.js';
import { generalRules, bodyGuidelines, subjectAndBodyGuidelines, usingImperativeMood } from './commit-message-standard.js';

export default abstract class BasePrompt {
  protected AI = AIProvider();
  protected rules: RulesEngine;

  constructor(
    rules: RulesEngine,
    ...scopes: RuleScope[]
  ) {
    this.rules = rules.narrow(...scopes);
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
    // This will keep prompting the user until it's valid address it.
    while (true) {      
      const [errors] = this.rules.validate(commit, 'fix');
      if (errors.length) await this.prompt(commit);
      else break;
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
}
