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
     * Creates an AI Service using OpenAI as the underlying agent
     * @returns
     */
    static openai() {
      const apikey = process.env.COMMITIONAL_OPENAI_KEY;
      const baseURL = process.env.COMMITIONAL_OPENAI_URL;
      if (!apikey) throw new Error('OpenAI API key is missing');
      if (!baseURL) throw new Error('OpenAI API URL is missing');

      return new AI(OpenAICompletion, baseURL, apikey);
    }

    /**
     * Creates an AI Service using Amplify as the underlying agent
     * @returns
     */
    static amplify() {
      const apikey = process.env.COMMITIONAL_AMPLIFY_KEY;
      const baseURL = process.env.COMMITIONAL_AMPLIFY_URL;
      if (!apikey) throw new Error('Amplify API key is missing');
      if (!baseURL) throw new Error('Amplify API URL is missing');

      return new AI(AmplifyCompletion, baseURL, apikey);
    }

    /**
     * Creates an AI Service from the configured preferencs and available ENV preferences.
     * @returns - AI
     */
    static byPreference() {
      if (process.env.COMMITIONAL_OPENAI_KEY) return AI.openai();
      if (process.env.COMMITIONAL_AMPLIFY_KEY) return AI.amplify();

      throw new Error(
        'No OpenAI or Amplify key provided. Please set COMMITIONAL_{OPENAI|AMPLIFY}_KEY environment variable.',
      );
    }
  }
  return AI;
}

export type AI = ReturnType<typeof Provider>;
export type IAIService = InstanceType<AI>;
