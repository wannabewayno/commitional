import { input, select } from '@inquirer/prompts';
import { red } from 'yoctocolors';
import type RulesEngine from '../rules/index.js';
import BasePrompt from './BasePrompt.js';
import type { CommitMessage } from './index.js';
import { ScopeDeducer } from '../services/ScopeDeducer/index.js';
import type Diff from '../services/Git/Diff.js';

export default class ScopePrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'scope');
  }

  async generate(diff: Diff, _commit: Partial<CommitMessage>): Promise<string> {
    const scopeDeducer = ScopeDeducer.fromRulesEngine(this.rules);
    const scope = scopeDeducer.deduceScope(diff.files) ?? [];
    return scope.join(',');
  }

  async prompt(initialValue?: string): Promise<string> {
    const scopes = (initialValue ?? '').split(',').filter(v => v.trim() !== '');

    // TODO: default should be the initial value if there is one.
    // TODO: Scope is harder as it's technically a list, we'll need to go deeper here depending on the scope-allow-multiple rule.
    // TODO: Scope enums will need to be expanded to look at the file system in order to deduce allowed scopes (only if an enum is set)
    // otherwise it's a free for all, no need to do anything fancy just let the user type stuff and lint the damn thing.

    const answer = scopes.length
      ? await select<string>({ message: "Select the scope of the change that you're committing:", choices: scopes })
      : await input({
          message: "Scope of the change you're committing:",
          validate: value => {
            const valid = this.rules.validate(value);
            if (!valid) return this.rules.check(value).join('\n');
            return true;
          },
          transformer: value => {
            value = this.rules.parse(value);
            if (!this.rules.validate(value)) value = red(value);
            return value;
          },
        });
    return this.rules.parse(answer);
  }
}
