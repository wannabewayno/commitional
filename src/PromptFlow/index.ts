import { select, Separator, type SelectWithBannerConfig } from 'inquirer-select-with-banner';

interface Choice {
  index: number;
  value?: string;
}

/**
 * Type definition for options in the prompt chain
 * Each option can be either:
 * - A Break symbol to exit the chain
 * - A function returning Break or void
 * - An async function returning Break or void
 */
type ChainOptions<T extends object> = (Extract<keyof T, string> | `${Extract<keyof T, string>}:${string}` | Separator)[];

type Handler = (selected: Choice, choices: (string | Separator)[]) => boolean | Promise<boolean>;

/**
 * Class that manages a flow of prompts with chainable options
 * Allows creating interactive command-line flows where users can select
 * from multiple options until choosing to break the chain
 */
export default class PromptFlow<const HandlerMap extends { [name: string]: Handler }> {
  /**
   * Symbol used to break out of the prompt flow chain
   */
  static Separator(separator?: string): Separator {
    return new Separator(separator);
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
    private readonly handlerMap: HandlerMap,
    private readonly options?: ChainOptions<HandlerMap>,
    private readonly config?: Omit<SelectWithBannerConfig<keyof HandlerMap>, 'message' | 'choices'>,
  ) {}

  /**
   * Starts the prompt flow chain
   * Displays options to user and handles their selection until a break condition is met
   * @returns Promise that resolves when the flow is complete
   */
  async prompt(): Promise<void> {
    const choices = this.options ? this.options : Object.keys(this.handlerMap);

    // Present options to user and get their selection
    const answer = await select<keyof HandlerMap>({
      message: this.message,
      choices: choices.map(v => {
        if (v instanceof Separator) return v;
        const [value, name] = v.split(':');
        return { value: v, name: (name ?? value)?.trim() } as { value: keyof HandlerMap; name: string | undefined };
      }),
      ...this.config,
    }).then(ans => ans as string);

    const [handlerKey, value] = answer.split(':');

    const index = choices.findIndex(v => (v instanceof Separator ? false : v.startsWith(answer)));

    const handler = this.handlerMap[handlerKey as keyof HandlerMap];
    const shouldBreak =
      typeof handler === 'function' ? await Promise.resolve(handler({ index, value }, choices)) : undefined;

    // Break the chain when returns true
    if (shouldBreak) return;

    // Otherwise continue the chain recursively
    return this.prompt();
  }

  static build() {
    return new PromptFlowBuilder({});
  }
}

class PromptFlowBuilder<const HandlerMap extends { [name: string]: Handler }> {
  constructor(private handlerMap: HandlerMap) {}

  addHandler(name: string, handler: Handler) {
    return new PromptFlowBuilder({ ...this.handlerMap, [name]: handler });
  }

  addBreak(name: string) {
    return new PromptFlowBuilder({ ...this.handlerMap, [name]: () => true });
  }

  construct(
    message: string,
    options?: ChainOptions<HandlerMap>,
    config?: Omit<SelectWithBannerConfig<string | number | symbol>, 'message' | 'choices'>,
  ) {
    return new PromptFlow(message, this.handlerMap, options, config);
  }
}
