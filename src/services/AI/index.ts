import CompletionProvider, { type ICompletion } from './Completion/index.js';
import OpenAICompletionProvider from './Completion/OpenAI.js';
import AmplifyCompletionProvider from './Completion/Amplify.js';
import axios from 'axios';

/**
 * AI class for handling completions using a specified completion builder
 * @template Builder - A constructor type that creates a CompletionBuilder instance
 */

export default function Provider() {
  const Completion = CompletionProvider(axios);
  const OpenAICompletion = OpenAICompletionProvider(Completion);
  const AmplifyCompletion = AmplifyCompletionProvider(Completion);

  class AI<Builder extends new (baseURL: string, apiKey: string) => ICompletion> {
    /**
     * Creates an instance of the AI class
     * @param apiKey - API key for authentication
     * @param Completion - Completion builder constructor
     */

    constructor(
      private readonly CompletionBuilder: Builder,
      private readonly baseURL: string,
      private readonly apiKey: string,
    ) {}

    /**
     * Creates a new completion builder instance
     * @returns A new CompletionBuilder instance
     */
    completion() {
      return new this.CompletionBuilder(this.baseURL, this.apiKey);
    }

    /**
     * Creates an AIService using OpenAI as the underlying agent
     * @returns
     */
    static OpenAI() {
      const apikey = process.env.COMMITIONAL_OPENAI_KEY;
      const baseURL = process.env.COMMITIONAL_OPENAI_URL;
      if (!apikey) throw new Error('OpenAI API key is missing');
      if (!baseURL) throw new Error('OpenAI API URL is missing');

      return new AI(OpenAICompletion, baseURL, apikey);
    }

    /**
     * Creates an AIService using Amplify as the underlying agent
     * @returns
     */
    static Amplify() {
      const apikey = process.env.COMMITIONAL_AMPLIFY_KEY;
      const baseURL = process.env.COMMITIONAL_AMPLIFY_URL;
      if (!apikey) throw new Error('Amplify API key is missing');
      if (!baseURL) throw new Error('Amplify API URL is missing');

      return new AI(AmplifyCompletion, baseURL, apikey);
    }
  }
  return AI;
}

export type AI = ReturnType<typeof Provider>;
export type IAIService = InstanceType<AI>;