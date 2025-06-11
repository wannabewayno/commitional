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
    let answer: string;

    if (this.rules.validate(initialValue)) answer = initialValue as string;
    else {
      const scopes = (initialValue ?? '').split(',').filter(v => v.trim() !== '');

      answer = scopes.length
        ? await select({ message: "Select the scope of the change that you're committing:", choices: scopes })
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
    }

    return this.rules.parse(answer);
  }
}
