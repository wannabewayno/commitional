import { select, type SelectWithBannerConfig } from 'inquirer-select-with-banner';

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
export default class PromptFlow {
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
