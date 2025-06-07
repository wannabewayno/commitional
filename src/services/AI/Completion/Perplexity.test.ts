import { expect } from 'chai';
import sinon from 'sinon';
import Completion from './index.js';
import PerplexityCompletionProvider, { type PerplexityCompletion, type IPerplexityCompletion } from './Perplexity.js';
import axios from 'axios';

describe('PerplexityCompletion Unit Tests', () => {
  let PerplexityCompletion: PerplexityCompletion;
  let Perplexity: IPerplexityCompletion;
  let httpPostStub: sinon.SinonStub;

  before(() => {
    // biome-ignore lint/suspicious/noExplicitAny: test code
    const create = (...args: any[]) => {
      const httpClient = axios.create(...args);
      httpPostStub = sinon.stub(httpClient, 'post');
      return httpClient;
    };

    PerplexityCompletion = PerplexityCompletionProvider(Completion({ create }));
  });

  beforeEach(() => {
    // Create a new instance of PerplexityCompletion before each test
    Perplexity = new PerplexityCompletion('https://api.perplexity.com/v1', 'api_key');
  });

  afterEach(() => {
    // Restore the stub after each test
    httpPostStub.restore();
  });

  describe('text()', () => {
    it('should return text response when successful', async () => {
      // Arrange
      const expectedResponse = 'This is a test response';
      httpPostStub.resolves({
        data: {
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                type: 'text',
                role: 'assistant',
                content: expectedResponse,
              },
            },
          ],
        },
      });

      // Act
      Perplexity.system('You are a helpful assistant');
      Perplexity.prompt('Tell me about TypeScript');
      const result = await Perplexity.text();

      // Assert
      expect(result).to.equal(expectedResponse);
      expect(httpPostStub.calledOnce).to.be.true;

      const callArgs = httpPostStub.firstCall.args;
      expect(callArgs[0]).to.equal('/chat/completions');
      expect(callArgs[1].messages).to.deep.include({
        role: 'system',
        content: 'You are a helpful assistant',
      });
      expect(callArgs[1].messages).to.deep.include({
        role: 'user',
        content: 'Tell me about TypeScript',
      });
      expect(callArgs[1].model).to.equal('sonar');
    });

    it('should return error when API returns error', async () => {
      // Arrange
      const errorMessage = 'API error occurred';
      httpPostStub.rejects(new Error(errorMessage));

      // Act
      Perplexity.prompt('Tell me about TypeScript');
      const result = await Perplexity.text();

      // Assert
      expect(result).to.be.instanceOf(Error);
      expect((result as Error).message).to.equal(errorMessage);
    });

    it('should return error when API response is malformed', async () => {
      // Arrange
      httpPostStub.resolves({ data: {} }); // Missing choices

      // Act
      Perplexity.prompt('Tell me about TypeScript');
      const result = await Perplexity.text();

      // Assert
      expect(result).to.be.instanceOf(Error);
    });
  });

  describe('json()', () => {
    it('should parse JSON response with valid schema', async () => {
      // Arrange
      const jsonResponse = '{"name": "John", "age": 30}';
      httpPostStub.resolves({
        data: {
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                type: 'text',
                role: 'assistant',
                content: jsonResponse,
              },
            },
          ],
        },
      });

      // Act
      Perplexity.system('Return JSON data');
      Perplexity.prompt('Get person data');
      const result = await Perplexity.json('Person', {
        name: 'string',
        age: 'number',
      });

      // Assert
      expect(result).to.deep.equal({ name: 'John', age: 30 });
    });

    it('should return error when schema validation fails', async () => {
      // Arrange
      const invalidJsonResponse = '{"name": "John", "age": "thirty"}'; // age should be number
      httpPostStub.resolves({
        data: {
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: { type: 'text', content: invalidJsonResponse },
            },
          ],
        },
      });

      // Act
      Perplexity.prompt('Get person data');
      const result = await Perplexity.json('Person', {
        name: 'string',
        age: 'number',
      });

      // Assert
      expect(result).to.be.instanceOf(Error);
    });

    it('should return error when API returns error', async () => {
      // Arrange
      const errorMessage = 'API error occurred';
      httpPostStub.rejects(new Error(errorMessage));

      // Act
      Perplexity.prompt('Get person data');
      const result = await Perplexity.json('Person', {
        name: 'string',
        age: 'number',
      });

      // Assert
      expect(result).to.be.instanceOf(Error);
      expect((result as Error).message).to.equal(errorMessage);
    });

    it('should return error when response is not valid JSON', async () => {
      // Arrange
      const invalidJson = 'This is not JSON';
      httpPostStub.resolves({
        data: {
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: { type: 'text', content: invalidJson },
            },
          ],
        },
      });

      // Act
      Perplexity.prompt('Get person data');
      const result = await Perplexity.json('Person', {
        name: 'string',
        age: 'number',
      });

      // Assert
      expect(result).to.be.instanceOf(Error);
    });
  });

  describe('Method chaining', () => {
    it('should support method chaining', async () => {
      // Arrange
      httpPostStub.resolves({
        data: {
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                type: 'text',
                role: 'assistant',
                content: 'Response',
              },
            },
          ],
        },
      });

      // Act & Assert - This should not throw
      const result = await Perplexity.system('You are a helpful assistant').prompt('Tell me about TypeScript').text();

      expect(result).to.equal('Response');
    });
  });
});
