import type RulesEngine from '../RulesEngine/index.js';

import ScopePrompt from './ScopePrompt.js';
import TypePrompt from './TypePrompt.js';
import SubjectPrompt from './SubjectPrompt.js';
import BodyPrompt from './BodyPrompt.js';
import { oraPromise } from 'ora';
import type { CommitPart } from '../RulesEngine/index.js';
import CommitMessage from '../CommitMessage/index.js';
import { green } from 'yoctocolors';
import type Diff from '../services/Git/Diff.js';
import { select, type SelectWithBannerConfig } from 'inquirer-select-with-banner';

/**
 * Factory function that creates appropriate prompt instances based on commit part
 * @param rules - The rules engine containing validation rules
 * @returns A function that returns the appropriate prompt for a given commit part
 */
export function PromptFactory(rules: RulesEngine) {
  return (commitPart: CommitPart) => {
    // Return the appropriate prompt based on the commit part
    switch (commitPart) {
      case 'type':
        return new TypePrompt(rules);
      case 'scope':
        return new ScopePrompt(rules);
      case 'subject':
        return new SubjectPrompt(rules);
      case 'body':
        return new BodyPrompt(rules);
      default:
        throw new Error(`Unknown commit part: ${commitPart}`);
    }
  };
}

/**
 * Factory function that creates a function to prompt for commit parts
 * @param rules - The rules engine containing validation rules
 * @param diff - The diff object containing staged changes
 * @param auto - Whether to automatically generate commit parts
 * @returns A function that prompts for a specific commit part
 */
export function CommitPartFactory(rules: RulesEngine, diff: Diff, auto = false) {
  const { required } = rules.allowedCommitProps();
  const requiredProps = Object.fromEntries(required.map(name => [name, `<${name}>`])) as Record<CommitPart, string>;

  /**
   * Renders a preview of the commit message with the current part highlighted
   * @param emphasis - The part to emphasize in the preview
   * @param value - The value to show for the emphasized part
   * @returns Formatted commit message text
   */
  function renderText(commit: CommitMessage, emphasis: CommitPart, value = `<${emphasis}>`) {
    const commitJsonWithEmphasis = {
      type: commit.type || requiredProps.type,
      scope: commit.scope || requiredProps.scope,
      subject: commit.subject || requiredProps.subject,
      body: commit.body || requiredProps.body,
      // footer: merged.footer ?? requiredProps.,
      [emphasis]: value ? green(value) : '',
    };

    // Format the commit message with all parts
    return CommitMessage.fromParts(commitJsonWithEmphasis).toString();
  }

  // Create a prompt factory to get the appropriate prompt for each part
  const promptFactory = PromptFactory(rules);

  /**
   * Function to prompt for a specific commit part
   * @param commitPart - The part of the commit to prompt for
   * @param partialCommit - Partial commit message with any already-provided parts
   * @returns Promise resolving to the value for the requested commit part
   */
  return async (commitPart: Exclude<CommitPart, 'footer'>, commit: CommitMessage): Promise<string> => {
    // Get the appropriate prompt for this commit part
    const prompt = promptFactory(commitPart);

    // Either auto-generate the value or use the provided value
    return auto
      ? await oraPromise(prompt.generate(diff, commit), {
          // Show loading spinner with preview text while generating
          text: `Generating ${renderText(commit, commitPart)}`,
          // Text to show on the command line history when generation completes
          successText: value => renderText(commit, commitPart, value),
        })
      : // Present the prompt to the user with the initial value
        prompt.promptIfInvalid(commit[commitPart]);
  };
}

/**
 * Type definition for options in the prompt chain
 * Each option can be either:
 * - A Break symbol to exit the chain
 * - A function returning Break or void
 * - An async function returning Break or void
 */
type ChainOptions = {
  [x: string]:
    | typeof PromptFlow.Break
    // biome-ignore lint/suspicious/noConfusingVoidType: Required for compatibility with void return types
    | (() => typeof PromptFlow.Break | void)
    // biome-ignore lint/suspicious/noConfusingVoidType: Required for compatibility with void return types
    | (() => Promise<typeof PromptFlow.Break | void>);
};

/**
 * Class that manages a flow of prompts with chainable options
 * Allows creating interactive command-line flows where users can select
 * from multiple options until choosing to break the chain
 */
export class PromptFlow {
  /**
   * Symbol used to break out of the prompt flow chain
   */
  static Break = Symbol('break');
  /**
   * Creates a new PromptFlow instance
   * @param message - The prompt message to display to the user
   * @param options - Object containing the available options and their handlers
   * @param config - Optional configuration for the select prompt
   * @throws Error if no break condition exists in the options
   */
  constructor(
    private readonly message: string,
    private readonly options: ChainOptions, // TODO: a function that can update itself on every loop incase this creates or removes options.
    private readonly config?: Omit<SelectWithBannerConfig<string | number>, 'message' | 'choices'>,
  ) {
    // Verify that at least one option contains a break condition
    if (Object.values(options).some(v => v === PromptFlow.Break)) return;

    // Throw error if no break condition exists to prevent infinite loops
    throw new Error('No break condition, will result in an infinite prompt loop');
  }

  /**
   * Starts the prompt flow chain
   * Displays options to user and handles their selection until a break condition is met
   * @returns Promise that resolves when the flow is complete
   */
  async prompt(): Promise<void> {
    // Present options to user and get their selection
    const answer = await select<keyof typeof this.options>({
      message: this.message,
      choices: Object.keys(this.options) as string[],
      ...this.config,
    });

    // Get the handler for the selected option
    const handler = this.options[answer];

    // Execute the handler if it's a function, otherwise use the direct value
    const value = typeof handler === 'function' ? await Promise.resolve(handler()) : handler;

    // Break the chain if Break symbol is returned
    if (value === PromptFlow.Break) return;

    // Otherwise continue the chain recursively
    return this.prompt();
  }
}
