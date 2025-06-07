import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'node:fs';
import BasePrompt from './BasePrompt.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Create a test subclass that exposes the protected method
class TestBasePrompt extends BasePrompt {
  public testCommitStandard(): string {
    return this.commitStandard();
  }
}

describe('BasePrompt', () => {
  describe('commitStandard', () => {
    let fsReadFileStub: sinon.SinonStub;
    let basePrompt: TestBasePrompt;
    const mockContent = '# Commit Message Standard\n\nThis is a test standard.';

    beforeEach(() => {
      // Create stub for fs.readFileSync
      fsReadFileStub = sinon.stub(fs, 'readFileSync').returns(mockContent);

      // Create instance with minimal dependencies
      basePrompt = new TestBasePrompt(
        {
          narrow: () => ({ validate: () => true }),
          // biome-ignore lint/suspicious/noExplicitAny: fake interface, it's test code.
        } as any,
        'type',
      );
    });

    afterEach(() => {
      // Restore the stub
      fsReadFileStub.restore();
    });

    it('should read and return the content of commit-message-standard.md', () => {
      // Call the method through our test subclass
      const result = basePrompt.testCommitStandard();

      // Verify the result
      expect(result).to.equal(mockContent);
      console.log(result);

      // Verify that readFileSync was called with the correct path
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const expectedPath = path.join(__dirname, 'commit-message-standard.md');
      expect(fsReadFileStub.calledWith(expectedPath, 'utf8')).to.be.true;
    });
  });
});
