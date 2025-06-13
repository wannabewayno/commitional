import type RulesEngine from '../RulesEngine/index.js';
import type { CommitPart } from '../RulesEngine/index.js';
import AIProvider from '../services/AI/index.js';
import type Diff from '../services/Git/Diff.js';
import commitMessageStandard from './commit-message-standard.js';
import type { CommitMessage } from './index.js';

export default abstract class BasePrompt {
  protected AI = AIProvider();
  protected rules: RulesEngine;

  constructor(rules: RulesEngine, type: CommitPart) {
    this.rules = rules.narrow(type);
  }

  protected commitStandard(): string {
    return commitMessageStandard;
  }

  /**
   * Prompt the user to provide a value for the defined part of the commit message.
   * @param initialValue
   */
  abstract prompt(): Promise<string>;

  /**
   * Validate the initial value (if any) and if required prompt the user.
   * @param initialValue
   */
  async promptIfInvalid(initialValue?: string): Promise<string> {
    return this.rules.validate(initialValue) ? this.rules.parse(initialValue ?? '') : await this.prompt();
  }

  /**
   * Generate a part of the commit message based on the diff and the parts of the commit message that may be available so far.
   * @param diff
   * @param commit
   */
  abstract generate(diff: Diff, commit: Partial<CommitMessage>): Promise<string>;
}
