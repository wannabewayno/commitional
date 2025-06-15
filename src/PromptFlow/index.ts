import { select, Separator, type SelectWithBannerConfig } from 'inquirer-select-with-banner';

type Handler =
  | typeof PromptFlow.Break
  // biome-ignore lint/suspicious/noConfusingVoidType: Required for compatibility with void return types
  | (() => typeof PromptFlow.Break | void)
  // biome-ignore lint/suspicious/noConfusingVoidType: Required for compatibility with void return types
  | (() => Promise<typeof PromptFlow.Break | void>);

/**
 * Type definition for options in the prompt chain
 * Each option can be either:
 * - A Break symbol to exit the chain
 * - A function returning Break or void
 * - An async function returning Break or void
 */
type ChainOptions = ([name: string, handler: Handler] | [Separator])[];

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
  static Separator(separator?: string): [Separator] {
    return [new Separator(separator)];
  }
  /**
   * Creates a new PromptFlow instance
   * @param message - The prompt message to display to the user
   * @param options - Object containing the available options and their handlers
   * @param config - Optional configuration for the select prompt
   * @throws Error if no break condition exists in the options
   */
  constructor(
    private readonly message: string,
    private readonly options: ChainOptions | (() => ChainOptions),
    private readonly config?: Omit<SelectWithBannerConfig<string | number>, 'message' | 'choices'>,
  ) {}

  /**
   * Starts the prompt flow chain
   * Displays options to user and handles their selection until a break condition is met
   * @returns Promise that resolves when the flow is complete
   */
  async prompt(): Promise<void> {
    const choices = typeof this.options === 'function' ? this.options() : this.options;

    // handle separators separator [---]
    // Present options to user and get their selection
    const answer = await select<string>({
      message: this.message,
      choices: choices.map(v => v[0]),
      ...this.config,
    });

    // Get the handler for the selected option
    const [, handler] = choices.find(handler => handler[0] === answer) as [string, Handler];

    // Execute the handler if it's a function, otherwise use the direct value
    const value = typeof handler === 'function' ? await Promise.resolve(handler()) : handler;

    // Break the chain if Break symbol is returned
    if (value === PromptFlow.Break) return;

    // Otherwise continue the chain recursively
    return this.prompt();
  }
}
