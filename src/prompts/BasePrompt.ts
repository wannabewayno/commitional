import type RulesEngine from '../rules/index.js';
import type { CommitPart } from '../rules/index.js';
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
   * Validate the initial value (if any) and if required prompt the user.
   * @param initialValue
   */
  abstract prompt(initialValue?: string): Promise<string>;

  /**
   * Generate a part of the commit message based on the diff and the parts of the commit message that may be available so far.
   * @param diff
   * @param commit
   */
  abstract generate(diff: Diff, commit: Partial<CommitMessage>): Promise<string>;
}
