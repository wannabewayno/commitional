import type { type } from 'arktype';
import { NetworkError, ValidationError, ResponseError, handleNetworkError } from '../errors.js';
import { AxiosError } from 'axios';

interface HttpClient {
  post: <T>(url: string, data: unknown) => Promise<{ status: number; headers: Record<string, string>; data: T }>;
}
interface HttpClientProvider {
  create: (_: { baseURL: string; headers: Record<string, string> }) => HttpClient;
}

export type UseCase =
  | 'Mathematics'
  | 'Science'
  | 'Analysis'
  | 'Education'
  | 'Training'
  | 'Troubleshooting'
  | 'Templating'
  | 'Coding'
  | 'Design'
  | 'Marketing'
  | 'Advertising'
  | 'Writing'
  | 'Conversation';

type Validation<T, R> = (input: T) => Error | R

interface RetryOpts<T, R> {
  validate?: Validation<T, R>
  maxAttempts?: number
  delay?: number
  type?: 'exponential' | 'linear'
}

/**
 * Abstract base class for handling AI completions from an Agentic API
 */
export default function Provider(http: HttpClientProvider) {
  abstract class Completion {
    protected readonly http: HttpClient;
    protected model?: string;
    protected systemMessage?: string;
    protected messages: { role: 'user' | 'assistant'; content: string }[] = [];

    /**
     * Creates a new Completion instance
     * @param apiKey The API key used for authentication
     */
    constructor(baseURL: string, headers: Record<string, string>) {
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';

      this.http = http.create({ baseURL, headers });
    }

    /**
     * Sets the model to use for completions
     * @param model The model identifier to use
     * @returns The current instance for method chaining
     */
    setModel(model: string): this {
      this.model = model;
      return this;
    }

    /**
     * Convenience for JSON.parse() with built in try/catch
     */
    protected parseJSON<ValidJSON = unknown>(data: string): ValidJSON | Error {
      try {
        return JSON.parse(data);
      } catch (error) {
        return new Error(`Invalid JSON: ${error} for '${data}'`);
      }
    }

    /**
     * Internally, configure any parameters that align with the provided usecase
     * @param usecase
     */
    abstract usecase(usecase: UseCase): this;

    /**
     * Sets the system message for the completion
     * @param message The system message to set
     * @returns The current instance for method chaining
     */
    system(...messages: string[]): this {
      this.systemMessage = messages.join('\n');

      return this;
    }

    /**
     * Adds a user message for the completion
     * @param message The prompt message to set
     * @returns The current instance for method chaining
     */
    user(...lines: string[]): this {
      this.messages.push({
        role: 'user',
        content: lines.join('\n'),
      });

      return this;
    }

    /**
     * Adds an assistant message for the completion if there's one to set
     * @param message The prompt message to set
     * @returns The current instance for method chaining
     */
    assistant(...lines: string[]): this {
      this.messages.push({
        role: 'assistant',
        content: lines.join('\n'),
      });

      return this;
    }

    /**
     * Gets the completion result as text
     * Interally this should call an Agentic API with the system and prompt and return the result as a string.
     * @returns Promise that resolves to the completion text or Error if an error was encountered
     */
    abstract text<R = string>(validate?: (response: string) => Error | R): Promise<R>;

    /**
     * Gets the completion result as JSON matching the provided schema
     * Interally this should call an Agentic API with the system and prompt and instruct the Agent to return a result that matches the provided schema.
     * @param schema The schema to validate the JSON against
     * @returns Promise that resolves to the typed JSON data
     */
    abstract json<const SchemaDefinition extends object, R = type.instantiate<SchemaDefinition>['infer']>(
      name: string,
      schema: type.validate<SchemaDefinition>,
      validate?: (response: type.instantiate<SchemaDefinition>['infer']) => Error | R
    ): Promise<R>;

    protected async try<T, R = T>(
      apiCall: () => Promise<T>,
      { validate, maxAttempts = 3, delay = 1000, type = 'exponential' }: RetryOpts<T, R> = {},
    ): Promise<R> {
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          const res = await apiCall();
          
          const validated = validate ? validate(res) : res as R;
          if (validated instanceof Error) throw new ValidationError(validated.message, '', validated);
          
          return validated;
        } catch (e: unknown) {
          const err = e as Error | AxiosError | ValidationError;

          const error = err instanceof AxiosError
            ? handleNetworkError(err)
            : err instanceof ValidationError
              ? err
              : new ResponseError(err.message, err);
          
          attempts++;
          if (attempts >= maxAttempts || !error.retryable) throw error;

          // Handle different error types
          if (error instanceof NetworkError) {
            // Network errors: just wait and retry
            await this.delay(delay * (type === 'exponential' ? Math.E ** attempts - 1 : attempts));
          } else if (error instanceof ValidationError) {
            this.user(
              'The previous response did not pass validation, please review the error details and submit a new response',
              '## Validation Error Details',
              error.validationDetails
            );
          } else if (error instanceof ResponseError) {
            this.user(
              'The previous response encountered an error; please fix the response and try again.',
              '## Error Messsage',
              error.message
            );
          }
        }
      }

      throw new Error('Max attempts reached');
    }

    private delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  return Completion;
}

export type Completion = ReturnType<typeof Provider>;
export type ICompletion = InstanceType<Completion>;
