import { ArkErrors, type } from 'arktype';
import type { Completion } from './index.js';

function formatArkErrors(error: ArkErrors) {
  return new Error([''].concat(error.map((v, index) => `  ${index + 1}.) ${v.toString()}`)).join('\n'));
}

const scope = type.module({
  content: 'string',
  base_message: {
    role: '"system" | "user" | "assistant"',
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
  format_schema: {
    type: '"json_schema"',
    json_schema: {
      name: 'string',
      schema: 'object',
    },
  },
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
    response_format: '(format_json | format_schema | format_text)?',
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

type CompletionRequest = typeof scope.completion_request.infer;

export default function Provider(Completion: Completion) {
  class xAICompletion extends Completion {
    constructor(baseURL?: string, apiKey?: string) {
      const headers: Record<string, string> = {};
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      if (!baseURL) baseURL = 'https://api.x.ai/v1';

      super(baseURL, headers);
    }

    private _temperature: Temperature = Temperature.Coding;

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
      if (this.systemMessage) messages.unshift({ role: 'system', content: this.systemMessage });

      return messages;
    }

    async text<R = string>(validate?: (response: string) => Error | R): Promise<R> {
      const messages = this.buildMessages();

      const body: CompletionRequest = {
        model: this.model || 'grok-3-mini-beta',
        messages,
        temperature: this._temperature,
      };

      return this.try(
        () => this.http.post('/chat/completions', body),
        {
          validate: (input) => {
            const payload = scope.completion_response(input.data);
            if (payload instanceof ArkErrors) return formatArkErrors(payload); // Validation Errors

            const choice = payload.choices[0];
            if (!choice) throw new Error('The response is empty');

            const response = choice.message.content;

            // Add the response as the assistant message for further interactions.
            this.assistant(response);

            // Validate the response.
            return validate ? validate(response): response as R;
          }
        }
      )
    }

    async json<const SchemaDefinition extends object, R = type.instantiate<SchemaDefinition>['infer']>(
      name: string,
      schemaDef: type.validate<SchemaDefinition>,
      validate?: (response: type.instantiate<SchemaDefinition>['infer']) => Error | R
    ): Promise<R> {
      const messages = this.buildMessages();

      const schema = type(schemaDef);

      // Exactly the same as text, except prime the model return a JSON schema
      const body: CompletionRequest = {
          model: this.model || 'grok',
          messages,
          temperature: this._temperature,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name,
              schema: schema.toJsonSchema({ dialect: null }),
            },
          },
      }

      return this.try(
        () => this.http.post('/chat/completions', body),
        {
          validate: (input) => {
            const payload = scope.completion_response(input.data);
            if (payload instanceof ArkErrors) return formatArkErrors(payload); // Validation Errors

            const choice = payload.choices[0];
            if (!choice) return new Error('Agent response is empty');

            // Check to see if it's valid JSON
            const json = this.parseJSON(choice.message.content);
            if (json instanceof Error) return json;

            // Check if the JSON matches our schema.
            const data = schema(json);

            // Successful response but invaid format, collect errors into a single error.
            if (data instanceof ArkErrors) return formatArkErrors(data);

            // Valid, Schema, however does the schema parse arbitrary formatting provided by the user?
            return validate ? validate(data): data as R;
          }
        }
      )
    }
  }

  return xAICompletion;
}

export type xAICompletion = ReturnType<typeof Provider>;
export type IxAICompletion = InstanceType<xAICompletion>;
