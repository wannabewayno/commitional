import { confirm, editor, select, input } from '@inquirer/prompts';
import type RulesEngine from '../RulesEngine/index.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import BasePrompt from './BasePrompt.js';
import type Diff from '../services/Git/Diff.js';
import type CommitMessage from '../CommitMessage/index.js';

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

    const selectedEditor = await select<string>({
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

  async generate(diff: Diff, commit: CommitMessage) {
    const ai = this.AI.byPreference();

    const res = await ai
      .completion()
      .usecase('Coding')
      .system(
        'You are integrated into a cli that helps software engineers write meaningful git commits.',
        'You will be provided with the git diff of the currenty staged files to be committed asked to either generate a commit type, scope, title, or body.',
        'If previous parts of the commit message are known, these will also be provided for you.',
        'The following rules and guidelines must be adhered to.\n',
        await this.commitStandard(),
      )
      .prompt(
        'Generate an appropriate commit body for the provided staged files to be committed',
        'The partially constructed commit has been provided for context',
        '## Partial Commit',
        commit.toString(),
        '## Git Diff',
        '```txt',
        diff.toString(),
        '```',
      )
      // Force the output to be in JSON.
      .json('commit_body', { body: 'string' });

    if (res instanceof Error) throw res;

    // set the commit's body
    commit.body = res.body;
  }

  async prompt(initialValue?: string): Promise<string> {
    // Ensure we have an editor command
    await this.checkEditor();

    // Gather all the errors currently with the body and display them in the editor as a comment.
    const answer = await editor({
      message: '',
      default: this.defaultMessage(initialValue),
      waitForUseInput: false,
      validate: value => {
        // Trim comments
        const content = value.replace(/^#.+$/gm, '').trim();

        const valid = this.rules.validate(content);

        // Invalid, return a list of errors
        if (!valid) return this.rules.check(content).join('\n');

        // otherwise must be valid
        return true;
      },
    });

    // Remove any comments from the commit body
    const content = answer.replace(/^#.+$/gm, '').trim();

    return this.rules.parse(content);
  }

  private defaultMessage(initialValue?: string) {
    const errors = this.rules.check(initialValue ?? '');

    // If there are any errors construct an error message with list of errors
    // The user's commit body is in breach of the rules and these show the user how to address it.
    const errorMessage = errors.length
      ? ['The following errors were found with the commit body'].concat(errors.map(v => `- ${v}`))
      : [];

    // Guidelines
    // Get these from all rules and describe them.
    // Place this under a few lines to write in

    // Look for a maxLineLength rule.
    // const [maxLineLengthRule] = this.rules.getRulesOfType('max-line-length');
    // const maxLineLength = maxLineLengthRule?.value ?? null;
    // TODO: Add a padding of '#' showing how long each line must be. above and below a text area or like #<------ max Length -------->|

    const comments = this.comment(
      'Type your message below and close the editor to continue',
      "Lines starting with '#' will be ignored",
      ...errorMessage,
    );

    return [comments, initialValue ?? '', '# Rules and guidelines here'].join('\n\n');
  }

  private comment(...lines: string[]) {
    return `# ${lines.join('\n# ')}`;
  }
}
