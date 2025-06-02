import { input, select } from '@inquirer/prompts';
import { red } from 'yoctocolors';
import type RulesEngine from '../rules/index.js';

export default class ScopePrompt {
  private rules: RulesEngine;

  constructor(rules: RulesEngine) {
    this.rules = rules.narrow('scope');
  }

  async prompt(deducedScopes: string): Promise<string> {
    let answer: string;

    if (this.rules.validate(deducedScopes)) answer = deducedScopes as string;
    else {
      const scopes = deducedScopes.split(',').filter(v => v.trim() !== '');

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
