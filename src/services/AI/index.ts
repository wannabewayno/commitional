import CompletionProvider, { type ICompletion } from './Completion/index.js';
import OpenAICompletionProvider from './Completion/OpenAI.js';
import AmplifyCompletionProvider from './Completion/Amplify.js';
import PerplexityCompletionProvider from './Completion/Perplexity.js';
import xAICompletionProvider from './Completion/xAI.js';
import axios from 'axios';

interface AIVar {
  name: string;
  apiKey: string;
  url?: string;
  model?: string;
  preference: number;
}

/**
 * Creates and configures an AI provider with completion capabilities
 * @returns A configured AI class that can create completion instances
 */
export default function Provider() {
  const Completion = CompletionProvider(axios);
  const OpenAICompletion = OpenAICompletionProvider(Completion);
  const AmplifyCompletion = AmplifyCompletionProvider(Completion);
  const PerplexityCompletion = PerplexityCompletionProvider(Completion);
  const xAICompletion = xAICompletionProvider(Completion);

  /**
   * AI class for handling completions using a specified completion builder
   * @template Builder - A constructor type that creates a CompletionBuilder instance
   */
  class AI<Builder extends new (baseURL?: string, apiKey?: string) => ICompletion> {
    /**
     * Creates an instance of the AI class
     * @param CompletionBuilder - The completion builder constructor
     * @param baseURL - Base URL for the API
     * @param apiKey - API key for authentication
     */
    constructor(
      private readonly CompletionBuilder: Builder,
      private readonly baseURL?: string,
      private readonly apiKey?: string,
      private readonly defaultModel?: string,
    ) {}

    /**
     * Creates a new completion builder instance
     * @returns A new CompletionBuilder instance
     */
    completion() {
      const instance = new this.CompletionBuilder(this.baseURL, this.apiKey);
      if (this.defaultModel) instance.setModel(this.defaultModel);

      return instance;
    }

    /**
     * Creates an AI Service from the configured preferences and available ENV variables
     * @returns An AI service instance or throws an error if no services are available
     * @throws Error if no services are available with proper credentials
     */
    static byPreference() {
      const potentialServices = ['openai', 'amplify', 'perplexity', 'xai'].map(service =>
        AI.loadEnvForNamedService(service),
      );

      const availableServices = potentialServices.filter(v => !(v instanceof Error)) as Exclude<
        ReturnType<typeof AI.loadEnvForNamedService>,
        Error
      >[];

      // If we have no available services (missing credentials) throw an error with the missing environment variables.
      if (!availableServices.length) throw new Error((potentialServices as Error[]).map(v => v.message).join('\n'));

      // Otherwise we have at least one available service to use.
      // Sort them by their preference.
      availableServices.sort((a, b) => a.preference - b.preference);

      const [{ name, url, apiKey, model }] = availableServices as [AIVar];

      const service = AI.loadNamedService(name, url, apiKey, model);
      if (service instanceof Error) throw service;

      return service;
    }

    /**
     * Loads a specific AI service by name
     * @param name - The name of the service to load (e.g., 'openai', 'amplify')
     * @returns An AI service instance or an error if the service cannot be loaded
     * @private
     */
    private static loadNamedService(name: string, url?: string, apiKey?: string, model?: string) {
      switch (name) {
        case 'xai':
          return new AI(xAICompletion, url, apiKey, model);
        case 'openai':
          return new AI(OpenAICompletion, url, apiKey, model);
        case 'perplexity':
          return new AI(PerplexityCompletion, url, apiKey, model);
        case 'amplify':
          return new AI(AmplifyCompletion, url, apiKey, model);
        default:
          return new Error(`Unknown service: ${name}`);
      }
    }

    /**
     * Loads environment variables for a named service
     * @param name - The name of the service (e.g., 'openai', 'amplify')
     * @returns An object with service configuration or an error if required variables are missing
     * @private
     */
    private static loadEnvForNamedService(name: string): AIVar | Error {
      name = name.toUpperCase();
      const [apiKey, url, preference, model] = ['KEY', 'URL', 'PREFERENCE', 'MODEL'].map(
        suffix => process.env[`COMMITIONAL_${name}_${suffix}`],
      );

      // Setting preference to 0 disables this from being used.
      if (preference === '0')
        return new Error(
          `${name} api has been disabled, to re-enable set COMMITIONA_${name}_PREFERENCE to a number greater than 0`,
        );
      if (!apiKey)
        return new Error(
          `No API key provided for ${name} service. Please set COMMITIONAL_${name}_KEY environment variable.`,
        );

      return { name: name.toLowerCase(), apiKey, url, model, preference: preference ? Number(preference) : 1 };
    }
  }
  return AI;
}

/**
 * Type representing the AI provider class returned by the Provider function
 */
export type AI = ReturnType<typeof Provider>;

/**
 * Type representing an instance of the AI service
 */
export type IAIService = InstanceType<AI>;
