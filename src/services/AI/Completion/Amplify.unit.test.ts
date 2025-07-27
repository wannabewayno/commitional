import { expect } from 'chai';
import sinon from 'sinon';
import Completion from './index.js';
import AmplifyCompletionProvider, { type AmplifyCompletion, type IAmplifyCompletion } from './Amplify.js';
import axios from 'axios';

describe('AmplifyCompletion Integration Tests', () => {
  let AmplifyCompletion: AmplifyCompletion;
  let amplify: IAmplifyCompletion;
  let httpPostStub: sinon.SinonStub;

  before(() => {
    // biome-ignore lint/suspicious/noExplicitAny: test code
    const create = (...args: any[]) => {
      const httpClient = axios.create(...args);
      httpPostStub = sinon.stub(httpClient, 'post');
      return httpClient;
    };

    AmplifyCompletion = AmplifyCompletionProvider(Completion({ create }));
  });

  beforeEach(() => {
    // Create a new instance of AmplifyCompletion before each test
    amplify = new AmplifyCompletion('https://domain.com', 'api_key');
  });

  afterEach(() => {
    // Restore the stub after each test
    httpPostStub.restore();
  });

  describe('text()', () => {
    it('should return text response when successful', async () => {
      // Arrange
      const expectedResponse = 'This is a test response';
      httpPostStub.resolves({ data: { assistant_resp: expectedResponse } });

      // Act
      amplify.system('You are a helpful assistant');
      amplify.user('Tell me about TypeScript');
      const result = await amplify.text();

      // Assert
      expect(result).to.equal(expectedResponse);
      expect(httpPostStub.calledOnce).to.be.true;

      const callArgs = httpPostStub.firstCall.args;
      expect(callArgs[0]).to.equal('/external/api/completion');
      expect(callArgs[1].messages).to.deep.include({
        role: 'system',
        content: 'You are a helpful assistant',
      });
      expect(callArgs[1].messages).to.deep.include({
        role: 'user',
        content: [{ type: 'text', text: 'Tell me about TypeScript' }],
      });
    });

    it('should return error when API returns error', async () => {
      // Arrange
      const errorMessage = 'API error occurred';
      httpPostStub.resolves({ data: { error: errorMessage } });

      // Act
      amplify.user('Tell me about TypeScript');
      const result = await amplify.text();

      // Assert
      expect(result).to.be.instanceOf(Error);
      expect((result as Error).message).to.equal(errorMessage);
    });
  });

  describe('json()', () => {
    it('should parse JSON response with valid schema', async () => {
      // Arrange
      const jsonResponse = '{"name": "John", "age": 30}';
      httpPostStub.resolves({ data: { assistant_resp: jsonResponse } });

      // Act
      amplify.system('Return JSON data');
      amplify.user('Get person data');
      const result = await amplify.json('Person', {
        name: 'string',
        age: 'number',
      });

      // Assert
      expect(result).to.deep.equal({ name: 'John', age: 30 });
    });

    it('should return error when schema validation fails', async () => {
      // Arrange
      const invalidJsonResponse = '{"name": "John", "age": "thirty"}'; // age should be number
      httpPostStub.resolves({ data: { assistant_resp: invalidJsonResponse } });

      // Act
      amplify.user('Get person data');
      const result = await amplify.json('Person', {
        name: 'string',
        age: 'number',
      });

      // Assert
      expect(result).to.be.instanceOf(Error);
    });

    it('should return error when API returns error', async () => {
      // Arrange
      const errorMessage = 'API error occurred';
      httpPostStub.resolves({ data: { error: errorMessage } });

      // Act
      amplify.user('Get person data');
      const result = await amplify.json('Person', {
        name: 'string',
        age: 'number',
      });

      // Assert
      expect(result).to.be.instanceOf(Error);
      expect((result as Error).message).to.equal(errorMessage);
    });
  });

  describe('Method chaining', () => {
    it('should support method chaining', async () => {
      // Arrange
      httpPostStub.resolves({ data: { assistant_resp: 'Response' } });

      // Act & Assert - This should not throw
      const result = await amplify.system('You are a helpful assistant').user('Tell me about TypeScript').text();

      expect(result).to.equal('Response');
    });
  });
});
