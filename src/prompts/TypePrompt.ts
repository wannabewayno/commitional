import { input, select } from '@inquirer/prompts';
import type RulesEngine from '../rules/index.js';
import AIProvider from '../services/AI/index.js';
import { type } from 'arktype';

const AI = AIProvider();
export default class TypePrompt {
  private rules: RulesEngine;

  constructor(rules: RulesEngine) {
    this.rules = rules.narrow('type');
  }
  // Craft the Commit Message Standard from the Rules provided for the thing we're doing.
  // You might even be able to get AI to generate this and then cache this as a system message on the user's system until next use.
  // Fallback to the hardcopy if it can't be written to or something.
  async generate(scope: string, diff: string) {
    const amplify = AI.Amplify();
    // TODO: Register them based on availability to apikeys and preferences.
    const res = await amplify.completion()
    // Reference the good commit guide
    // Tell the agent what it's role and purpose is
    .system(
      // Tell the agent what it's purpose is.
      // TODO: Commit Message Standard from Rules
      // Ideally this type prompt needs to be extended from some base prompt that has this.
      // Give it rules to follow (print the current rules)
    )
    .prompt(
      'Select the appropriate commit type for:',
      '1. Commit Subject Format `<type>(scope?): <title>`',
      '2. Git Diff'
      // Receive the scope and git diff to create a type for.
    )
    // Force the output to be in JSON.
    .json(type('"fix"|"feat"'));

    if (res instanceof Error) throw res;
    return res;
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
