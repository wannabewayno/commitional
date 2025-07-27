import { ArkErrors, type } from 'arktype';
import type { Completion } from './index.js';

interface SystemMessage extends BaseMessage {
  role: 'system';
  content: string; // Required for system messages
}

interface Content {
  type: 'text' | 'image_url';
}

interface TextContent extends Content {
  type: 'text';
  text: string;
}

interface ImageContent extends Content {
  type: 'image_url';
  image_url: { url: string };
}

type MessageContent = TextContent | ImageContent;

interface BaseMessage {
  role: string;
  content: string;
}

interface SystemMessage extends BaseMessage {
  role: 'system';
}

interface UserMessage extends Omit<BaseMessage, 'content'> {
  role: 'user';
  content: MessageContent[];
}

// Assistant message with content
interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  content: string; // Required if tool_calls is not provided
}

// Union type for all possible message types
type AIMessage = SystemMessage | UserMessage | AssistantMessage;

interface AssistantResponse {
  assistant_resp: string;
}
interface ErrorResponse {
  error: string;
}

type CompletionResponse = AssistantResponse | ErrorResponse;

// biome-ignore lint/suspicious/noExplicitAny: Type assertion is legal here.
const isErrorResponse = (p: any): p is ErrorResponse => !!p.error;

interface CompletionRequest {
  model_id: string;
  messages: AIMessage[];
  temperature?: number;
}

enum Temperature {
  Mathematics = 0.1, // Requires absolute precision
  Science = 0.2, //
  Analysis = 0.2, // Should stick closely to facts
  Education = 0.3, // Needs accurate information
  Training = 0.3, //
  Troubleshooting = 0.3, // Logical consistency is key
  Templating = 0.4, // Structured output is important
  Coding = 0.5, // Needs structure but some creativity
  Design = 0.7, // Benefits from creative variations
  Marketing = 0.8, // Needs creativity but stays on message
  Advertising = 0.8,
  Writing = 1.2, // Creative writing benefits from randomness
  Conversation = 1.5, // More natural with some unpredictability
}

const GPT4o = '8cac310c-065b-4866-827d-cdac270f7fb7'; // GPT-4o

export default function Provider(Completion: Completion) {
  class AmplifyCompletion extends Completion {
    constructor(baseURL?: string, apiKey?: string) {
      const headers: Record<string, string> = {};
      if (apiKey) headers.Token = apiKey;
      if (!baseURL) baseURL = 'https://amplify.planittesting.com';

      super(baseURL, headers);
    }

    private _temperature?: Temperature;
    private _system?: SystemMessage;
    private messages: (UserMessage | AssistantMessage)[] = [];

    system(...lines: string[]): this {
      this._system = { role: 'system', content: lines.join('\n') };
      return this;
    }

    user(...lines: string[]): this {
      this.messages.push({ role: 'user', content: [{ type: 'text', text: lines.join('\n') }] });
      return this;
    }

    assistant(...message: string[]): this {
      this.messages.push({ role: 'assistant', content: message.join('\n') });
      return this;
    }

    usecase(
      usecase:
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
        | 'Conversation',
    ): this {
      this._temperature = Temperature[usecase];
      return this;
    }

    private buildMessages(): CompletionRequest['messages'] {
      const messages = [...this.messages] as CompletionRequest['messages'];
      if (this._system) messages.unshift(this._system);

      return messages;
    }

    // So we actually don't care
    async text(): Promise<string | Error> {
      const messages = this.buildMessages();

      const res = await this.http
        .post<CompletionResponse>('/external/api/completion', {
          model_id: this.model || GPT4o,
          messages,
          temperature: this._temperature,
        })
        .catch((v: Error) => ({ data: { error: v.message } }));

      return isErrorResponse(res.data) ? new Error(res.data.error) : res.data.assistant_resp;
    }

    async json<const SchemaDefinition extends object>(
      name: string,
      schemaDef: type.validate<SchemaDefinition>,
    ): Promise<type.instantiate<SchemaDefinition>['infer'] | Error> {
      // Ensure a system message exists
      if (!this._system) this._system = { role: 'system', content: '' };

      const schema = type(schemaDef);

      // Appened an important rule that tells the agent to always use JSON.
      this._system.content += [
        '**IMPORTANT**',
        'You **always** provide responses as valid json that conform to the following json schema',
        '```json',
        JSON.stringify({ name, schema: schema.toJsonSchema() }),
        '```',
      ].join('\n');

      // Build our messages (including any user provided stuff)
      const messages = this.buildMessages();

      // Make the request
      const res = await this.http
        .post<CompletionResponse>('/external/api/completion', {
          model_id: this.model || GPT4o,
          messages,
          temperature: this._temperature,
        })
        .catch((v: Error) => ({ data: { error: v.message } }));

      // An error occured, return a new error
      if (isErrorResponse(res.data)) return new Error(res.data.error);

      const json = this.parseJSON(res.data.assistant_resp);
      if (json instanceof Error) return json;

      // Successsful response, check if the format is valid.
      const data = schema(json);

      // Successful response but invaid format, collect errors into a single error.
      if (data instanceof ArkErrors)
        return new Error([''].concat(data.map((v, index) => `  ${index + 1}.) ${v.toString()}`)).join('\n'));

      // Hooray it's valid.
      return data;
    }
  }

  return AmplifyCompletion;
}

export type AmplifyCompletion = ReturnType<typeof Provider>;
export type IAmplifyCompletion = InstanceType<AmplifyCompletion>;
