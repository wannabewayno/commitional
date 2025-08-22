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

    // Common editor commandsgit a
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
    const completion = await this.createAiCompletion().then(completion =>
      completion.user(
        'Generate an appropriate commit body for the provided staged files to be committed',
        'The partially constructed commit has been provided for context',
        '## Partial Commit',
        commit.toString(),
        '## Git Diff',
        '```txt',
        diff.toString(),
        '```',
      ),
    );

    // set the commit's body
    commit.body = await completion.json('body', { value: 'string' }).then(({ value }) => value);
  }

  async prompt(commit: CommitMessage): Promise<void> {
    const scope = this.rules.omit('exists', 'allow-multiple');

    // Ensure we have an editor command
    await this.checkEditor();

    // Gather all the errors currently with the body and display them in the editor as a comment.
    const answer = await editor({
      message: '',
      default: this.defaultMessage(commit),
      waitForUseInput: false,
      validate: value => {
        // Trim comments
        const content = value.replace(/^#.+$/gm, '').trim();

        const [, errors] = scope.validate(content);
        if (errors.length) return errors.join('\n');
        return true;
      },
    });

    // Remove any comments and validate
    const [body] = scope.validate(answer.replace(/^#.+$/gm, '').trim());

    // Assign to commit body
    commit.body = body;
  }

  private defaultMessage(commit: CommitMessage) {
    const [errors] = this.rules.validate(commit, 'fix');

    // If there are any errors construct an error message with list of errors
    // The user's commit body is in breach of the rules and these show the user how to address it.
    const errorMessage = errors.length
      ? ['The following errors were found with the commit body'].concat(errors.map(v => `- ${v}`))
      : [];

    const generalRules = this.rules.generalRules();

    // Look for a maxLineLength rule.
    // const [maxLineLengthRule] = this.rules.getRulesOfType('max-line-length');
    // const maxLineLength = maxLineLengthRule?.value ?? null;
    // TODO: Add a padding of '#' showing how long each line must be. above and below a text area or like #<------ max Length -------->|

    const comments = this.comment(
      'Type your message below and close the editor to continue',
      "Lines starting with '#' will be ignored",
      ...errorMessage,
    );

    return [comments, commit.body, generalRules].join('\n\n');
  }

  private comment(...lines: string[]) {
    return `# ${lines.join('\n# ')}`;
  }
}
