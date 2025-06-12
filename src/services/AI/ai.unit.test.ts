import { expect } from 'chai';
import Provider from './index.js';

describe('AI Service Tests', () => {
  const AI = Provider();
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv;
  });

  describe('byPreference', () => {
    it('should use default model when no model env var is set', () => {
      process.env.COMMITIONAL_OPENAI_KEY = 'test-key';
      process.env.COMMITIONAL_OPENAI_PREFERENCE = '1';

      const service = AI.byPreference();
      const completion = service.completion();

      // The model should be undefined, letting the provider use its default
      expect((completion as unknown as { model: string }).model).to.be.undefined;
    });

    it('should use model from env var when set', () => {
      process.env.COMMITIONAL_OPENAI_KEY = 'test-key';
      process.env.COMMITIONAL_OPENAI_PREFERENCE = '1';
      process.env.COMMITIONAL_OPENAI_MODEL = 'gpt-4';

      const service = AI.byPreference();
      const completion = service.completion();

      // The model should be set from the environment variable
      expect((completion as unknown as { model: string }).model).to.equal('gpt-4');
    });

    it('should handle multiple services with model preferences', () => {
      process.env.COMMITIONAL_OPENAI_KEY = 'test-key-1';
      process.env.COMMITIONAL_OPENAI_PREFERENCE = '4';
      process.env.COMMITIONAL_OPENAI_MODEL = 'gpt-4';

      process.env.COMMITIONAL_AMPLIFY_KEY = 'test-key-2';
      process.env.COMMITIONAL_AMPLIFY_PREFERENCE = '3';
      process.env.COMMITIONAL_AMPLIFY_MODEL = 'custom-model';

      process.env.COMMITIONAL_PERPLEXITY_KEY = 'test-key-3';
      process.env.COMMITIONAL_PERPLEXITY_PREFERENCE = '2';
      process.env.COMMITIONAL_PERPLEXITY_MODEL = 'perplexity-model';

      process.env.COMMITIONAL_XAI_KEY = 'test-key-4';
      process.env.COMMITIONAL_XAI_PREFERENCE = '1';
      process.env.COMMITIONAL_XAI_MODEL = 'xai-model';

      const service = AI.byPreference();
      const completion = service.completion();

      // Should use xAI since it has lowest preference number
      expect((completion as unknown as { model: string }).model).to.equal('xai-model');
    });

    it('should use default model for Perplexity when no model env var is set', () => {
      process.env.COMMITIONAL_PERPLEXITY_KEY = 'test-key';
      process.env.COMMITIONAL_PERPLEXITY_PREFERENCE = '1';

      const service = AI.byPreference();
      const completion = service.completion();

      // The model should be undefined, letting the provider use its default
      expect((completion as unknown as { model: string }).model).to.be.undefined;
    });

    it('should use default model for xAI when no model env var is set', () => {
      process.env.COMMITIONAL_XAI_KEY = 'test-key';
      process.env.COMMITIONAL_XAI_PREFERENCE = '1';

      const service = AI.byPreference();
      const completion = service.completion();

      // The model should be undefined, letting the provider use its default
      expect((completion as unknown as { model: string }).model).to.be.undefined;
    });
  });
});
