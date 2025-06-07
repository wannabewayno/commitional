import { confirm, editor, select, input } from '@inquirer/prompts';
import type RulesEngine from '../rules/index.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import BasePrompt from './BasePrompt.js';

const CUSTOM = 'custom';
export default class BodyPrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'body');
  }

  private async checkEditor(): Promise<Error | null> {
    // Check for existing editor in environment variables
    let editorCmd = process.env.EDITOR || process.env.VISUAL;

    if (editorCmd) return null;

    // Common editor commands
    const editorOptions = [
      { name: 'VS Code', value: 'code --wait --new-window' },
      { name: 'Vim', value: 'vim' },
      { name: 'Nano', value: 'nano' },
      { name: 'Emacs', value: 'emacs' },
      { name: 'Other', value: CUSTOM },
    ];

    const selectedEditor = await select({
      message: 'No editor found. Please select your preferred editor:',
      choices: editorOptions,
    });

    // Ask the user to input a custom command or use the selected one.
    if (selectedEditor === CUSTOM) editorCmd = await input({ message: 'Enter the command to open your editor:' });
    else editorCmd = selectedEditor;

    // Ask if they want to save this choice for the future by permanently adding it to their system.
    const saveChoice = await confirm({
      message: 'Would you like to set this as your default editor for future sessions?',
    });

    if (saveChoice) {
      // Save to their .bashrc
      try {
        const shellConfigPath = path.join(os.homedir(), '.bashrc');
        const editorExport = `\n# Added by commitional\nexport EDITOR="${editorCmd}"\n`;

        fs.appendFileSync(shellConfigPath, editorExport);
        console.log(`Editor preference saved to ${shellConfigPath}`);
      } catch (error) {
        return error as Error;
      }
    }

    // Set for current session
    process.env.EDITOR = editorCmd;

    return null;
  }

  async generate(scope: string, diff: string, type: string, title: string) {
    const ai = this.AI.byPreference();

    const res = await ai
      .completion()
      .usecase('Coding')
      .system(
        'You are integrated into a cli that helps software engineers write meaningful git commits.',
        'You will be provided with the git diff of the currenty staged files to be committed asked to either generate a commit type, scope, title, or body.',
        'If previous parts of the commit message are known, these will also be provided for you.',
        'The following rules and guidelines must be adhered to.\n',
        this.commitStandard(),
      )
      .prompt(
        'Generate an appropriate commit body for the provided staged files to be committed',
        'The commit subject has been provided for context',
        '## Subject',
        `${scope ? `${type}(${scope}): ${title}` : `${type}: ${title}`}`,
        '## Git Diff',
        '```txt',
        diff,
        '```',
      )
      // Force the output to be in JSON.
      .json('commit_body', { body: 'string' });

    if (res instanceof Error) throw res;
    return res.body;
  }

  async prompt(initialValue?: string): Promise<string> {
    let answer: string;

    // Body is optional unless required by user configured rules.

    // If it's valid
    if (this.rules.validate(initialValue)) {
      answer = initialValue ?? '';
      // if it's valid and empty, ask the user if they want to add one.
      if (answer === '') {
        const openEditor = await confirm({ message: 'Would you like to add a Commit body?' });

        // Default show the user an example. or the Good Commit guide.
        if (openEditor) {
          // Ensure we have an editor command
          await this.checkEditor();

          answer = await editor({
            waitForUseInput: false,
            message: '',
            default: this.defaultMessage(),
          });
        }
      }
    } else {
      answer = initialValue ?? '';
      // Ensure we have an editor command
      await this.checkEditor();

      // Make the default message be the Errors
      const errors = this.rules.check(answer);

      const defaultMessage = this.defaultMessage();

      const errorMessage = this.comment(
        'The following errors were found with the commit body',
        ...errors.map(v => `- ${v}`),
      );

      // Gather all the errors currently with the body and display them in the editor as a comment.
      answer = await editor({
        message: '',
        default: `${defaultMessage}\n${errorMessage}\n${answer}`,
        waitForUseInput: false,
        validate: value => {
          const valid = this.rules.validate(value);
          if (!valid) return this.rules.check(value).join('\n');
          return true;
        },
      });
    }

    // Remove any comments from the commit body
    answer = answer.replace(/^#.+$/gm, '').trim();

    return this.rules.parse(answer);
  }

  private defaultMessage() {
    return this.comment(
      'Type your message below and close the editor to continue',
      "Lines starting with '#' will be ignored",
    );
  }

  private comment(...lines: string[]) {
    return `# ${lines.join('\n# ')}`;
  }
}
