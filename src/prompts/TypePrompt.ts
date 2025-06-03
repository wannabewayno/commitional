import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../rules/index.js';

export default class TypePrompt {
  private rules: RulesEngine;

  constructor(rules: RulesEngine) {
    this.rules = rules.narrow('type');
  }

  async generate(scope: string, diff: string) {
    // TODO: Need some kind of AIService that picks the best available service for the ones we have.
    // Register them based on availability to apikeys and preferences.
    // TODO:
    // Receive the scope and git diff to create a type for.
    // const { type } = await AIService.completion.system(
    // Reference the good commit guide
    // Tell the agent what it's role and purpose is
    // ).prompt(
    // Prompt it for it's task.
    // Give it rules to follow (print the current rules)
    // ).json(schema)
    // If it fails try again, up to max attempts.
    // Potentially use git service that has these configured with the right context?
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
