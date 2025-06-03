import Completion from "./index.js";

const chatFamily = createModelFamily('chat', 'tokens')
  .powerful('8cac310c-065b-4866-827d-cdac270f7fb7', { input: 0, output: 0 })
  .capable('4cb81269-bd7e-4071-92ff-3113fe8199ef', { input: 0, output: 0 })
  .effective('b3231e8c-62b0-427b-9530-1e678f1a9196', { input: 0, output: 0 });

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

const isErrorResponse = (p: any): p is ErrorResponse => !!p.error;

interface CompletionRequest {
  model_id: string;
  messages: AIMessage[];
  temperature?: number;
}

export default class AmplifyCompletion extends Completion {
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

  async text(): Promise<string> {
    const messages = this.buildMessages();
    this.http.post('/external/api/completion', {
      model_id: '8cac310c-065b-4866-827d-cdac270f7fb7' // GPT-4o
      messages
    });
  }

  async json<S>(schema: S): Promise<S> {

    
  }

}