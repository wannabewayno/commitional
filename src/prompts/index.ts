import type RulesEngine from '../rules/index.js';

import ScopePrompt from './ScopePrompt.js';
import TypePrompt from './TypePrompt.js';
import SubjectPrompt from './SubjectPrompt.js';
import BodyPrompt from './BodyPrompt.js';
import { oraPromise } from 'ora';
import type { CommitPart } from '../rules/index.js';
import { formatCommitMessage } from '../lib/formatCommitMessage.js';
import { green } from 'yoctocolors';
import type Diff from '../services/Git/Diff.js';
import { select, type SelectWithBannerConfig } from 'inquirer-select-with-banner';

/**
 * Interface representing the structure of a commit message
 * with all possible parts that can be included
 */
export interface CommitMessage {
  /** The type of commit (e.g., feat, fix, docs) */
  type?: string;
  /** The subject/title of the commit */
  subject?: string;
  /** The scope of the changes (e.g., component name) */
  scope?: string;
  /** The detailed body text of the commit */
  body?: string;
  /** Indicates if this is a breaking change */
  breaking?: boolean; // breaking is a style... it augments the commit mesage?
  /** Footer information like "Closes #123" */
  footer?: string;
  /** The header line (type+scope+subject combined) */
  header?: string;
  /** Additional trailer information */
  trailer?: string;
}

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
 * Type definition for required parts of a commit message
 * Maps each commit part to a placeholder string
 */
type RequiredParts = { [K in CommitPart]?: `<${K}>` };

/**
 * Factory function that creates a function to prompt for commit parts
 * @param rules - The rules engine containing validation rules
 * @param diff - The diff object containing staged changes
 * @param auto - Whether to automatically generate commit parts
 * @returns A function that prompts for a specific commit part
 */
export function CommitPartFactory(rules: RulesEngine, diff: Diff, auto = false) {
  // Determine which parts are required based on 'empty' rules
  const requiredParts = rules.getRulesOfType('empty').reduce(
    (requiredParts, rule) => {
      // If the rule requires the part to never be empty, mark it as required
      if (rule.applicable === 'never') requiredParts[rule.name] = `<${rule.name}>`;
      return requiredParts;
    },
    {} as Record<string, string>,
  ) as RequiredParts;

  // Create a prompt factory to get the appropriate prompt for each part
  const promptFactory = PromptFactory(rules);

  /**
   * Function to prompt for a specific commit part
   * @param commitPart - The part of the commit to prompt for
   * @param partialCommit - Partial commit message with any already-provided parts
   * @returns Promise resolving to the value for the requested commit part
   */
  return async (commitPart: CommitPart, partialCommit: Partial<CommitMessage> = {}): Promise<string> => {
    /**
     * Renders a preview of the commit message with the current part highlighted
     * @param emphasis - The part to emphasize in the preview
     * @param value - The value to show for the emphasized part
     * @returns Formatted commit message text
     */
    function renderText(emphasis: CommitPart, value = `<${emphasis}>`) {
      // Merge required parts with provided parts and highlight the current part
      const merged = { ...requiredParts, ...partialCommit, [emphasis]: value ? green(value) : '' };

      // Format the commit message with all parts
      const commit = formatCommitMessage(merged);
      return commit.join('\n\n');
    }

    // Get the appropriate prompt for this commit part
    const prompt = promptFactory(commitPart);

    // Either auto-generate the value or use the provided value
    const value = auto
      ? await oraPromise(prompt.generate(diff, partialCommit), {
          // Show loading spinner with preview while generating
          text: `Generating ${renderText(commitPart)}`,
          // Show final preview when generation completes
          successText: value => `${renderText(commitPart, value)}`,
        })
      : partialCommit[commitPart];

    // Present the prompt to the user with the initial value
    return prompt.prompt(value);
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
    private readonly options: ChainOptions,
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
