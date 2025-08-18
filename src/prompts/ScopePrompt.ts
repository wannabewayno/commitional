import { input } from '@inquirer/prompts';
import { red } from 'yoctocolors';
import type RulesEngine from '../RulesEngine/index.js';
import BasePrompt from './BasePrompt.js';
import { ScopeDeducer } from '../services/ScopeDeducer/index.js';
import type Diff from '../services/Git/Diff.js';
import type CommitMessage from '../CommitMessage/index.js';

export default class ScopePrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'scope');
  }

  async generate(diff: Diff, commit: CommitMessage) {
    const scopeDeducer = ScopeDeducer.fromRulesEngine(this.rules);
    const scopes = scopeDeducer.deduceScope(diff.files) ?? [];

    // set the commit's scope
    commit.addScope(...scopes);
  }

  async prompt(commit: CommitMessage): Promise<void> {
    const inMemoryCommit = commit.clone();
    inMemoryCommit.setStyle((scope) => red(scope));

    // TODO: Scope enums will need to be expanded to look at the file system in order to deduce allowed scopes (only if an enum is set)
    await input({
      message: "Scope of the change you're committing:",
      default: inMemoryCommit.scope,
      prefill: 'editable',
      validate: value => {
        inMemoryCommit.scope = value;
        const [errors] = this.rules.validate(inMemoryCommit);
        if (errors.length) {
          inMemoryCommit.style('scope');
          return errors.join('\n');
        }
        inMemoryCommit.unstyle('scope');
        return true;
      },
      transformer: () => inMemoryCommit.scope,
    });

    commit.scope = inMemoryCommit.scope;
  }
}
