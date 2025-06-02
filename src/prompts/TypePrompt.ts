import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../rules/index.js';

export default class TypePrompt {
  private rules: RulesEngine;

  constructor(rules: RulesEngine) {
    this.rules = rules.narrow('type');
  }

  async prompt(initialValue?: string): Promise<string> {
    let answer: string;

    if (this.rules.validate(initialValue)) answer = initialValue as string;
    else {
      const [enumRule] = this.rules.getRulesOfType('enum');

      answer = enumRule
        ? await select({ message: "Select the type of change that you're committing:", choices: enumRule.value })
        : await input({
            message: "Type of change that you're committing:",
            validate: value => {
              const valid = this.rules.validate(value);
              if (!valid) return this.rules.check(value).join('\n');
              return true;
            },
            transformer: value => this.rules.parse(value),
          });
    }

    return this.rules.parse(answer);
  }
}
