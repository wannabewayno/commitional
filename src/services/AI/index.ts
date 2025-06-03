import type CompletionBuilder from './Completion/index.js';
import OpenAICompletion from './Completion/OpenAI.js';

/**
 * AI class for handling completions using a specified completion builder
 * @template Builder - A constructor type that creates a CompletionBuilder instance
 */

export class AI<Builder extends new (baseURL: string, apiKey: string) => CompletionBuilder> {
  /**
   * Creates an instance of the AI class
   * @param apiKey - API key for authentication
   * @param Completion - Completion builder constructor
   */

  constructor(
    private readonly baseURL: string,
    private readonly apiKey: string,
    private readonly Completion: Builder,
  ) {}

  /**
   * Creates a new completion builder instance
   * @returns A new CompletionBuilder instance
   */
  completion() {
    return new this.Completion(this.baseURL, this.apiKey);
  }

  /**
   * Creates an AIService using OpenAI as the underlying agent
   * @returns
   */
  static OpenAI() {
    // Extract apiKey
    // Extract configs, model, domain, etc...
    // return new AI(process.env.OPENAI_API_URL!, process.env.OPENAI_API_KEY!, OpenAICompletion);
  }
}
