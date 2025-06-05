import type { type, Type } from 'arktype';

interface HttpClient {
  post: <T>(url: string, data: unknown) => Promise<{ status: number; headers: Record<string, string>; data: T }>;
}
interface HttpClientProvider {
  create: (_: { baseURL: string; headers: Record<string, string> }) => HttpClient;
}

type UseCase =
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

/**
 * Abstract base class for handling AI completions from an Agentic API
 */
export default function Provider(http: HttpClientProvider) {
  abstract class Completion {
    protected readonly http: HttpClient;
    /**
     * Creates a new Completion instance
     * @param apiKey The API key used for authentication
     */
    constructor(baseURL: string, apiKey: string) {
      this.http = http.create({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      });
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
    abstract system(...message: string[]): this;

    /**
     * Sets the prompt/user message for the completion
     * @param message The prompt message to set
     * @returns The current instance for method chaining
     */
    abstract prompt(...message: string[]): this;

    /**
     * Gets the completion result as text
     * Interally this should call an Agentic API with the system and prompt and return the result as a string.
     * @returns Promise that resolves to the completion text
     */
    abstract text(): Promise<string | Error>;

    /**
     * Gets the completion result as JSON matching the provided schema
     * Interally this should call an Agentic API with the system and prompt and instruct the Agent to return a result that matches the provided schema.
     * @param schema The schema to validate the JSON against
     * @returns Promise that resolves to the typed JSON data
     */
    abstract json<const SchemaDefinition extends object>(
      name: string,
      schema: type.validate<SchemaDefinition>,
    ): Promise<type.instantiate<SchemaDefinition>['infer'] | Error>;
  }

  return Completion;
}

export type Completion = ReturnType<typeof Provider>;
export type ICompletion = InstanceType<Completion>;
