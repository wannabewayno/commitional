import type CompletionBuilder from './Completion/index.js';

/**
 * AI class for handling completions using a specified completion builder
 * @template Builder - A constructor type that creates a CompletionBuilder instance
 */

export class AI<Builder extends new (apiKey: string) => CompletionBuilder> {
  /**
   * Creates an instance of the AI class
   * @param apiKey - API key for authentication
   * @param Completion - Completion builder constructor
   */

  constructor(
    private readonly apiKey: string,
    private readonly Completion: Builder,
  ) {}

  /**
   * Creates a new completion builder instance
   * @returns A new CompletionBuilder instance
   */

  completion() {
    return new this.Completion(this.apiKey);
  }
}
