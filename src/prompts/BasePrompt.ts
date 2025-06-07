import type RulesEngine from '../rules/index.js';
import type { CommitPart } from '../rules/index.js';
import AIProvider from '../services/AI/index.js';
import commitMessageStandard from './commit-message-standard.js';

export default class BasePrompt {
  protected AI = AIProvider();
  protected rules: RulesEngine;

  constructor(rules: RulesEngine, type: CommitPart) {
    this.rules = rules.narrow(type);
  }

  protected commitStandard(): string {
    return commitMessageStandard;
  }
}
