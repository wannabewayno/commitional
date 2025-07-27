import { expect } from 'chai';
import sinon from 'sinon';
import Completion from './index.js';
import xAICompletionProvider, { type xAICompletion, type IxAICompletion } from './xAI.js';
import axios from 'axios';

describe('xAICompletion Unit Tests', () => {
  let xAICompletion: xAICompletion;
  let xAI: IxAICompletion;
  let httpPostStub: sinon.SinonStub;

  before(() => {
    // biome-ignore lint/suspicious/noExplicitAny: test code
    const create = (...args: any[]) => {
      const httpClient = axios.create(...args);
      httpPostStub = sinon.stub(httpClient, 'post');
      return httpClient;
    };

    xAICompletion = xAICompletionProvider(Completion({ create }));
  });

  beforeEach(() => {
    // Create a new instance of xAICompletion before each test
    xAI = new xAICompletion('https://api.xAI.com/v1', 'api_key');
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
      xAI.system('You are a helpful assistant');
      xAI.user('Tell me about TypeScript');
      const result = await xAI.text();

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
      expect(callArgs[1].model).to.equal('grok-3-mini-beta');
    });

    it('should return error when API returns error', async () => {
      // Arrange
      const errorMessage = 'API error occurred';
      httpPostStub.rejects(new Error(errorMessage));

      // Act
      xAI.user('Tell me about TypeScript');
      const result = await xAI.text();

      // Assert
      expect(result).to.be.instanceOf(Error);
      expect((result as Error).message).to.equal(errorMessage);
    });

    it('should return error when API response is malformed', async () => {
      // Arrange
      httpPostStub.resolves({ data: {} }); // Missing choices

      // Act
      xAI.user('Tell me about TypeScript');
      const result = await xAI.text();

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
      xAI.system('Return JSON data');
      xAI.user('Get person data');
      const result = await xAI.json('Person', {
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
      xAI.user('Get person data');
      const result = await xAI.json('Person', {
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
      xAI.user('Get person data');
      const result = await xAI.json('Person', {
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
      xAI.user('Get person data');
      const result = await xAI.json('Person', {
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
      const result = await xAI.system('You are a helpful assistant').user('Tell me about TypeScript').text();

      expect(result).to.equal('Response');
    });
  });
});
