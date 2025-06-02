import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../rules/index.js';
import type { RuleType } from '../rules/index.js';

export default class RulePrompt {
  constructor(
    private readonly rules: RulesEngine,
    // TODO: Select Message
    // TODO: Input Message
  ) {}

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
              const errors = this.rules.check(value);
              if (errors.length > 0) return errors.join('\n');
              return true;
            },
            transformer: value => this.rules.parse(value),
            theme: {
              style: {
                highlight: (text: string) => {
                  console.log('Highlighted text:', text);
                  return text;
                },
              },
            },
          });
    }

    return this.rules.parse(answer);
  }

  getRulesOfType<T extends RuleType>(type: T) {
    return this.rules.getRulesOfType(type);
  }
}
