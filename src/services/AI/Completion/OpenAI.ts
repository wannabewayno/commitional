import { ArkErrors, type } from 'arktype';
import type { Completion } from './index.js';

function formatArkErrors(error: ArkErrors) {
  return new Error([''].concat(error.map((v, index) => `  ${index + 1}.) ${v.toString()}`)).join('\n'));
}

const scope = type.module({
  content: 'string',
  base_message: {
    role: '"developer" | "system" | "user"',
    name: 'string?',
    content: 'content',
  },
  tool_message: {
    role: '"tool"',
    tool_call_id: 'string',
  },
  // Assistant message with content
  assistant_message: {
    role: '"assistant"',
    name: 'string?',
    refusal: '(string | null)?',
    content: 'content',
  },
  finish_reason: 'error_reason | success_reason',
  error_reason: '"length" | "flagged" | "error"',
  success_reason: '"stop" | "tool_call"',
  // Union type for all possible message types,
  ai_message: 'base_message | assistant_message | tool_message',
  usage: {
    prompt_tokens: 'number',
    completion_tokens: 'number',
    total_tokens: 'number',
    completion_tokens_details: {
      reasoning_tokens: 'number',
      accepted_prediction_tokens: 'number',
      rejected_prediction_tokens: 'number',
    },
  },
  between_0_and_1: '0 <= number <= 1',
  plus_or_minus_2: '-2 <= number <= 2',
  less_than_2: 'number <= 2',
  format_schema: { type: '"json_schema"', json_schema: 'object' },
  format_json: { type: '"json_object"' },
  format_text: { type: '"text"' },
  choices: {
    index: 'number',
    message: 'assistant_message',
    finish_reason: 'finish_reason',
  },
  // Request
  completion_request: {
    model: 'string',
    messages: 'ai_message[]',
    stop: 'string?',
    // tool_choice?: 'none' | 'auto' | 'required' | { type: 'function', function: { name: string } },
    temperature: 'less_than_2?', // between 0 <= x <= 2
    top_p: 'between_0_and_1?',
    frequency_penalty: 'plus_or_minus_2?',
    presence_penalty: 'plus_or_minus_2?',
    response_format: 'format_json | format_schema | format_text',
    max_completion_tokens: 'number?',
    n: 'number?',
    // prediction: Prediction
  },
  // Response
  completion_response: {
    // Commented out entries exist, but aren't being hard asserted against as we're not using them
    // id: 'string',
    // object: '"chat.completion"',
    // created: 'number',
    // model: 'string',
    // system_fingerprint: 'string',
    choices: 'choices[]',
    // usage: 'usage',
  },
});

type CompletionRequest = typeof scope.completion_request.infer;
type CompletionResponse = typeof scope.completion_response.infer;
type BaseMessage = typeof scope.base_message.infer;

export default function Provider(Completion: Completion) {
  class OpenAICompletion extends Completion {
    private _system?: BaseMessage;
    private _prompt?: BaseMessage;

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
      const res = await this.http
        .post<CompletionResponse>('/chat/completions', {
          model: 'gpt-4.1-mini',
          messages,
        } as CompletionRequest)
        .catch((v: Error) => v);

      if (res instanceof Error) return res;
      const payload = scope.completion_response(res.data);

      if (payload instanceof ArkErrors) return formatArkErrors(payload);
      const message = payload.choices[0].message.content;

      // Extract the response
      return message;
    }

    async json<const SchemaDefinition extends object>(
      schemaDef: type.validate<SchemaDefinition>,
    ): Promise<type.instantiate<SchemaDefinition>['infer'] | Error> {
      const messages = this.buildMessages();

      const schema = type(schemaDef);

      // Exactly the same as text, except prime the model return a JSON schema
      const res = await this.http
        .post('/chat/completions', {
          model: 'gpt-4.1-mini',
          messages,
          response_format: {
            type: 'json_schema',
            json_schema: schema.toJsonSchema(),
          },
        } as CompletionRequest).catch((v: Error) => v);

        if (res instanceof Error) return res;
        const payload = scope.completion_response(res.data);

        // Success, however payload differs from expected payload.
        if (payload instanceof ArkErrors) return formatArkErrors(payload);
        const message = payload.choices[0].message.content;
        
        // Check to see if it's valid JSON
        const json = this.parseJSON(message);
        if (json instanceof Error) return json;

        // Check if the JSON matches our schema.
        const data = schema(json);

        // Successful response but invaid format, collect errors into a single error.
        if (data instanceof ArkErrors) return formatArkErrors(data);

        // Hooray it's valid.
        return data;
    }
  }

  return OpenAICompletion;
}

export type OpenAICompletion = ReturnType<typeof Provider>;
export type IOpenAICompletion = InstanceType<OpenAICompletion>;
