import { ArkErrors, type, type Type } from 'arktype';
import type { Completion } from './index.js';

export enum FinishReason {
  Stop = 'stop', // stopped naturally (success, implementation methods)
  ToolCall = 'tool_calls', // tools will be in the attachments
  Length = 'length', // Err
  Flagged = 'content_filter', // Err
  Error = 'error', // Err
}

interface BaseMessage {
  role: string;
  name?: string;
  content: string;
}

interface DeveloperMessage extends BaseMessage {
  role: 'developer';
}

interface SystemMessage extends BaseMessage {
  role: 'system';
}

interface UserMessage extends BaseMessage {
  role: 'user';
}

interface ToolMessage extends BaseMessage {
  role: 'tool';
  tool_call_id: string;
}

// Assistant message with content
interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  refusal?: string | null;
  content: string;
}

// Union type for all possible message types
type OpenAIMessage = DeveloperMessage | SystemMessage | UserMessage | AssistantMessage | ToolMessage;

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  completion_tokens_details: {
    reasoning_tokens: number;
    accepted_prediction_tokens: number;
    rejected_prediction_tokens: number;
  };
}

interface CompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
  stop?: string;
  // tool_choice?: 'none' | 'auto' | 'required' | { type: 'function', function: { name: string } },
  temperature?: number; // between 0 <= x <= 2
  top_p?: number; // 0 <= x <= 1
  frequency_penalty?: number; // -2 <= x <= 2
  presence_penalty?: number; // -2 <= x <= 2
  response_format?: { type: 'json_schema'; json_schema: object } | { type: 'json_object' } | { type: 'text' };
  max_completion_tokens?: number;
  n?: number;
  // prediction: Prediction
}

interface CompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  system_fingerprint: string;
  choices: {
    index: number;
    message: AssistantMessage;
    finish_reason: FinishReason;
  }[];
  usage: Usage;
}

export default function Provider(Completion: Completion) {
  class OpenAICompletion extends Completion {
    private _system?: DeveloperMessage;
    private _prompt?: UserMessage;

    system(message: string): this {
      this._system = {
        role: 'developer',
        content: message,
      };

      return this;
    }

    prompt(message: string): this {
      this._prompt = {
        role: 'user',
        content: message,
      };

      return this;
    }

    private buildMessages(): CompletionRequest['messages'] {
      const messages: CompletionRequest['messages'] = [];
      if (this._system) messages.push(this._system);
      if (this._prompt) messages.push(this._prompt);

      return messages;
    }

    async text(): Promise<string | Error> {
      const messages = this.buildMessages();

      // Call the OpenAPI with a very basic completion request.
      // further paramters subject to fine-tuning and testing.
      const res = await this.http.post<CompletionResponse>('/chat/completions', {
        model: 'gpt-4.1-mini',
        messages,
      } as CompletionRequest).catch((v: Error) => ({
          data: {
            choices: [{ message: { content: new Error(v.message) } }]
          }
        }
      ));

      // Extract the response
      return res.data.choices[0].message.content;
    }

    async json<const SchemaDefinition extends object>(schemaDef: type.validate<SchemaDefinition>): Promise<type.instantiate<SchemaDefinition>['infer'] | Error> {
      const messages = this.buildMessages();

      const schema = type(schemaDef);

      // Exactly the same as text, except prime the model return a JSON schema
      const res = await this.http.post<CompletionResponse>('/chat/completions', {
        model: 'gpt-4.1-mini',
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: schema.toJsonSchema(),
        },
      } as CompletionRequest).catch((v: Error) => ({
          data: {
            choices: [{ message: { content: new Error(v.message) } }]
          }
        }
      ));

      // Mate define these as Ark Schemas... and validate these suckers.
      const message = res.data.choices[0].message.content;
      
      // An error occured, return a new error
      if (message instanceof Error) return message;

      const json = this.parseJSON(message);
      if (json instanceof Error) return json;
      
      // Successsful response, check if the format is valid.
      const data = schema(json);

      // Successful response but invaid format, collect errors into a single error.
      if (data instanceof ArkErrors) return new Error([''].concat(data.map((v, index) => `  ${index + 1}.) ${v.toString()}`)).join('\n'));

      // Hooray it's valid.
      return data;
    }
  }

  return OpenAICompletion;
}

export type OpenAICompletion = ReturnType<typeof Provider>;
export type IOpenAICompletion = InstanceType<OpenAICompletion>;
