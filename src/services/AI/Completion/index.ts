import axios, { type AxiosInstance } from 'axios';
/**
 * Abstract base class for handling AI completions from an Agentic API
 */
export default abstract class Completion {
  protected readonly http: AxiosInstance;
  /**
   * Creates a new Completion instance
   * @param apiKey The API key used for authentication
   */
  constructor(baseURL: string, apiKey: string) {
    this.http = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  /**
   * Sets the system message for the completion
   * @param message The system message to set
   * @returns The current instance for method chaining
   */
  abstract system(message: string): this;

  /**
   * Sets the prompt/user message for the completion
   * @param message The prompt message to set
   * @returns The current instance for method chaining
   */
  abstract prompt(message: string): this;

  /**
   * Gets the completion result as text
   * Interally this should call an Agentic API with the system and prompt and return the result as a string.
   * @returns Promise that resolves to the completion text
   */
  abstract text(): Promise<string>;

  /**
   * Gets the completion result as JSON matching the provided schema
   * Interally this should call an Agentic API with the system and prompt and instruct the Agent to return a result that matches the provided schema.
   * @param schema The schema to validate the JSON against
   * @returns Promise that resolves to the typed JSON data
   */
  abstract json<S>(schema: S): Promise<S>;
}
