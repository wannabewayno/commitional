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
    // TODO: default should be the initial value if there is one.
    // TODO: Scope is harder as it's technically a list, we'll need to go deeper here depending on the scope-allow-multiple rule.
    // TODO: Scope enums will need to be expanded to look at the file system in order to deduce allowed scopes (only if an enum is set)
    // otherwise it's a free for all, no need to do anything fancy just let the user type stuff and lint the damn thing.

    const answer = await input({
      message: "Scope of the change you're committing:",
      default: commit.scope,
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

    commit.scope = this.rules.parse(answer)[0];
  }
}
