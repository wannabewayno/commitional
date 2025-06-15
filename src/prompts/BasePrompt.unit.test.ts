import { expect } from 'chai';
import BasePrompt from './BasePrompt.js';
import type Diff from '../services/Git/Diff.js';
import type CommitMessage from '../CommitMessage/index.js';

// Create a test subclass that exposes the protected method
class TestBasePrompt extends BasePrompt {
  public testCommitStandard(): string {
    return this.commitStandard();
  }

  prompt(_initialValue?: string): Promise<string> {
    return Promise.resolve('');
  }

  generate(_diff: Diff, _commit: CommitMessage): Promise<string> {
    return Promise.resolve('');
  }
}

describe('BasePrompt', () => {
  describe('commitStandard', () => {
    let basePrompt: TestBasePrompt;

    beforeEach(() => {
      // Create stub for fs.readFileSync

      // Create instance with minimal dependencies
      basePrompt = new TestBasePrompt(
        {
          narrow: () => ({ validate: () => true }),
          // biome-ignore lint/suspicious/noExplicitAny: fake interface, it's test code.
        } as any,
        'type',
      );
    });

    it('should read and return the content of commit-message-standard.md', () => {
      // Call the method through our test subclass
      const result = basePrompt.testCommitStandard();

      // Verify the result
      expect(result).to.match(/^## General Rules/);
    });
  });
});
