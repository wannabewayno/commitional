import { ArkErrors, type, type Type } from "arktype";
import type { Completion } from "./index.js";

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

const GPT4o = '8cac310c-065b-4866-827d-cdac270f7fb7'; // GPT-4o

export default function Provider(Completion: Completion) {
  class AmplifyCompletion extends Completion {
    private _system?: SystemMessage;
    private _prompt?: UserMessage;

    system(message: string): this {
      this._system = { role: 'system', content: message };
      return this;
    }

    prompt(message: string): this {
      this._prompt = { role: 'user', content: [{ type: 'text', text: message }] };
      return this;
    }

    private buildMessages(): CompletionRequest['messages'] {
      const messages: CompletionRequest['messages'] = [];
      if (this._system) messages.push(this._system);
      if (this._prompt) messages.push(this._prompt);

      return messages;
    }

    // So we actually don't care 
    async text(): Promise<string | Error> {
      const messages = this.buildMessages();

      const res = await this.http.post<CompletionResponse>('/external/api/completion', {
        model_id: GPT4o,
        messages
      }).catch((v: Error) => ({ data: { error: v.message } }));

      return isErrorResponse(res.data) ? new Error(res.data.error) : res.data.assistant_resp;
    }

    async json<const SchemaDefinition extends object>(schemaDef: type.validate<SchemaDefinition>): Promise<type.instantiate<SchemaDefinition>['infer'] | Error> {
      // Ensure a system message exists
      if (!this._system) this._system = { role: 'system', content: '' };

      const schema = type(schemaDef);

      // Appened an important rule that tells the agent to always use JSON.
      this._system.content += [
        '**IMPORTANT**',
        'You **always** provide responses as valid json according to the following json schema',
        '```',
        schema.toJsonSchema(),
        '```'
      ].join('\n')

      // Build our messages (including any user provided stuff)
      const messages = this.buildMessages();

      // Make the request
      const res = await this.http.post<CompletionResponse>('/external/api/completion', {
        model_id: GPT4o,
        messages
      }).catch((v: Error) => ({ data: { error: v.message } }));

      // An error occured, return a new error
      if (isErrorResponse(res.data)) return new Error(res.data.error);

      const json = this.parseJSON(res.data.assistant_resp);
      if (json instanceof Error) return json;
      
      // Successsful response, check if the format is valid.
      const data = schema(json);

      // Successful response but invaid format, collect errors into a single error.
      if (data instanceof ArkErrors) return new Error([''].concat(data.map((v, index) => `  ${index + 1}.) ${v.toString()}`)).join('\n'));

      // Hooray it's valid.
      return data
    }
  }

  return AmplifyCompletion;
}

export type AmplifyCompletion = ReturnType<typeof Provider>;
export type IAmplifyCompletion = InstanceType<AmplifyCompletion>;