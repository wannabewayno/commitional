import { expect } from 'chai';
import sinon from 'sinon';
import { Provider } from './lint.js';
import CommitMessage from '../CommitMessage/index.js';
import RulesEngine from '../RulesEngine/index.js';
import Git from '../services/Git/index.js';

describe('Lint Cmd', () => {
  let mockGit: sinon.SinonStubbedInstance<Git>;
  let mockReadFile: sinon.SinonStub;
  let mockWriteFile: sinon.SinonStub;
  let mockLogError: sinon.SinonStub;
  let mockExit: sinon.SinonStub;
  let mockRulesEngine: sinon.SinonStubbedInstance<RulesEngine>;
  let lintCmd: ReturnType<typeof Provider>;

  beforeEach(() => {
    mockGit = sinon.createStubInstance(Git);
    mockReadFile = sinon.stub();
    mockWriteFile = sinon.stub();
    mockLogError = sinon.stub();
    mockExit = sinon.stub();
    // biome-ignore lint/suspicious/noExplicitAny: Complex typing has made this hard for sinon...
    mockRulesEngine = sinon.createStubInstance(RulesEngine) as any;

    // Mock RulesEngine.fromConfig
    sinon.stub(RulesEngine, 'fromConfig').resolves(mockRulesEngine);

    lintCmd = Provider({
      git: mockGit,
      readFile: mockReadFile,
      writeFile: mockWriteFile,
      logError: mockLogError,
      exit: mockExit as unknown as (code?: number | string | null | undefined) => never,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('File Path Arguments', () => {
    beforeEach(() => {
      mockReadFile.resolves('feat: add new feature');
    });

    it('should read commit message from file path', async () => {
      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('commit-msg.txt', {});

      expect(mockReadFile.calledWith('commit-msg.txt')).to.be.true;
      expect(mockExit.calledWith(0)).to.be.true;
    });

    it('should write fixed commit back to file when --fix is used', async () => {
      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      mockCommit.unstyle.returns(mockCommit);
      mockCommit.toString.returns('feat: fixed commit message');
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('commit-msg.txt', { fix: true });

      expect(mockWriteFile.calledWith('commit-msg.txt', 'feat: fixed commit message')).to.be.true;
      expect(mockExit.calledWith(0)).to.be.true;
    });

    it('should not write to file when --fix is not used', async () => {
      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('commit-msg.txt', {});

      expect(mockWriteFile.called).to.be.false;
    });

    it('should log errors for invalid commit from file', async () => {
      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([
        mockCommit,
        false,
        [{ type: 'subject', filter: undefined, errors: ['Subject too long'], warnings: [] }],
      ]);
      mockCommit.setStyle.returns(undefined);
      mockCommit.style.returns(mockCommit);
      mockCommit.toString.returns('feat: this subject is way too long for the rules');
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('commit-msg.txt', {});

      expect(mockLogError.called).to.be.true;
      expect(mockExit.calledWith(1)).to.be.true;
    });
  });

  describe('Commit Hash Arguments', () => {
    it('should fetch commit by hash', async () => {
      mockGit.log.resolves([
        {
          hash: '1234567890abcdef',
          short: '1234567',
          date: new Date(),
          msg: 'feat: add new feature',
          author: { name: 'Test User', email: 'test@example.com' },
        },
      ]);
      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('1234567', {});

      expect(mockGit.log.calledWith('1234567')).to.be.true;
      expect(mockReadFile.called).to.be.false;
      expect(mockExit.calledWith(0)).to.be.true;
    });

    it('should fetch commit by full hash', async () => {
      mockGit.log.resolves([
        {
          hash: '1234567890abcdef1234567890abcdef12345678',
          short: '1234567',
          date: new Date(),
          msg: 'feat: add new feature',
          author: { name: 'Test User', email: 'test@example.com' },
        },
      ]);
      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('1234567890abcdef1234567890abcdef12345678', {});

      expect(mockGit.log.calledWith('1234567890abcdef1234567890abcdef12345678')).to.be.true;
      expect(mockExit.calledWith(0)).to.be.true;
    });

    it('should not write to file when linting commit hash with --fix', async () => {
      mockGit.log.resolves([
        {
          hash: '1234567890abcdef',
          short: '1234567',
          date: new Date(),
          msg: 'feat: add new feature',
          author: { name: 'Test User', email: 'test@example.com' },
        },
      ]);
      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('1234567', { fix: true });

      expect(mockWriteFile.called).to.be.false;
      expect(mockExit.calledWith(0)).to.be.true;
    });
  });

  describe('Hash Range Arguments', () => {
    it('should fetch commits by hash range', async () => {
      mockGit.log.resolves([
        {
          hash: 'abc123def456',
          short: 'abc123d',
          date: new Date(),
          msg: 'feat: add feature 1',
          author: { name: 'Test User', email: 'test@example.com' },
        },
        {
          hash: 'def456ghi789',
          short: 'def456g',
          date: new Date(),
          msg: 'fix: fix bug 2',
          author: { name: 'Test User', email: 'test@example.com' },
        },
      ]);
      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('abc1234...def4567', {});

      expect(mockGit.log.calledWith('abc1234', 'def4567')).to.be.true;
      expect(mockExit.calledWith(0)).to.be.true;
    });

    it('should exit with error if any commit in range is invalid', async () => {
      mockGit.log.resolves([
        {
          hash: 'validhash123',
          short: 'validha',
          date: new Date(),
          msg: 'feat: valid commit',
          author: { name: 'Test User', email: 'test@example.com' },
        },
        {
          hash: 'invalidhash456',
          short: 'invalid',
          date: new Date(),
          msg: 'invalid commit',
          author: { name: 'Test User', email: 'test@example.com' },
        },
      ]);

      const validCommit = sinon.createStubInstance(CommitMessage);
      validCommit.process.returns([validCommit, true, []]);

      const invalidCommit = sinon.createStubInstance(CommitMessage);
      invalidCommit.process.returns([
        invalidCommit,
        false,
        [{ type: 'type', filter: undefined, errors: ['Type missing'], warnings: [] }],
      ]);
      invalidCommit.setStyle.returns(undefined);
      invalidCommit.style.returns(invalidCommit);
      invalidCommit.toString.returns('invalid commit');

      const fromStringStub = sinon.stub(CommitMessage, 'fromString');
      fromStringStub.onFirstCall().returns(validCommit);
      fromStringStub.onSecondCall().returns(invalidCommit);

      await lintCmd('abc1234...def4567', {});

      expect(mockLogError.called).to.be.true;
      expect(mockExit.calledWith(1)).to.be.true;
    });
  });

  describe('Numeric Arguments', () => {
    it('should treat numeric strings as commit hashes', async () => {
      // Numeric strings like "123" should be treated as commit hashes, not numbers
      mockGit.log.resolves([
        {
          hash: '123456789abcdef',
          short: '1234567',
          date: new Date(),
          msg: 'feat: add new feature',
          author: { name: 'Test User', email: 'test@example.com' },
        },
      ]);
      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('1234567', {});

      expect(mockGit.log.calledWith('1234567')).to.be.true;
      expect(mockExit.calledWith(0)).to.be.true;
    });

    it('should handle short numeric hashes', async () => {
      mockGit.log.resolves([
        {
          hash: '1234567890abcdef',
          short: '1234567',
          date: new Date(),
          msg: 'feat: add new feature',
          author: { name: 'Test User', email: 'test@example.com' },
        },
      ]);
      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('1234567', {});

      expect(mockGit.log.calledWith('1234567')).to.be.true;
      expect(mockExit.calledWith(0)).to.be.true;
    });
  });

  describe('Error Handling and Styling', () => {
    it('should style invalid commits with red and log detailed errors', async () => {
      mockReadFile.resolves('invalid: this subject is way too long and violates multiple rules');

      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([
        mockCommit,
        false,
        [
          { type: 'subject', filter: undefined, errors: ['Subject too long', 'Invalid format'], warnings: [] },
          { type: 'type', filter: undefined, errors: ['Invalid type'], warnings: [] },
        ],
      ]);
      mockCommit.setStyle.returns(undefined);
      mockCommit.style.returns(mockCommit);
      mockCommit.toString.returns('invalid: this subject is way too long and violates multiple rules');
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('commit-msg.txt', {});

      expect(mockCommit.setStyle.called).to.be.true;
      expect(mockCommit.style.calledTwice).to.be.true;
      expect(mockLogError.called).to.be.true;

      const loggedMessage = mockLogError.firstCall.args[0];
      expect(loggedMessage).to.include('subject');
      expect(loggedMessage).to.include('- Subject too long');
      expect(loggedMessage).to.include('- Invalid format');
      expect(loggedMessage).to.include('type');
      expect(loggedMessage).to.include('- Invalid type');

      expect(mockExit.calledWith(1)).to.be.true;
    });

    it('should handle commits with no errors gracefully', async () => {
      mockReadFile.resolves('feat: perfect commit message');

      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('commit-msg.txt', {});

      expect(mockLogError.called).to.be.false;
      expect(mockExit.calledWith(0)).to.be.true;
    });
  });

  describe('Options Handling', () => {
    it('should handle both fix and edit options', async () => {
      mockReadFile.resolves('feat: commit message');

      const mockCommit = sinon.createStubInstance(CommitMessage);
      mockCommit.process.returns([mockCommit, true, []]);
      mockCommit.unstyle.returns(mockCommit);
      mockCommit.toString.returns('feat: fixed commit message');
      sinon.stub(CommitMessage, 'fromString').returns(mockCommit);

      await lintCmd('commit-msg.txt', { fix: true });

      expect(mockWriteFile.called).to.be.true;
      expect(mockExit.calledWith(0)).to.be.true;
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty commit list', async () => {
      mockReadFile.rejects('File does not exist');
      mockGit.log.resolves([]);

      await lintCmd('nonexistent', {});

      expect(mockExit.calledWith(0)).to.be.true; // No commits to validate = success
    });

    it('should handle mixed valid and invalid commits', async () => {
      mockReadFile.throws('File does not exist');
      mockGit.log.resolves([
        {
          hash: 'validhash1',
          short: 'validh1',
          date: new Date(),
          msg: 'feat: valid commit',
          author: { name: 'Test User', email: 'test@example.com' },
        },
        {
          hash: 'invalidhash',
          short: 'invalid',
          date: new Date(),
          msg: 'invalid',
          author: { name: 'Test User', email: 'test@example.com' },
        },
        {
          hash: 'validhash2',
          short: 'validh2',
          date: new Date(),
          msg: 'fix: another valid commit',
          author: { name: 'Test User', email: 'test@example.com' },
        },
      ]);

      const validCommit1 = sinon.createStubInstance(CommitMessage);
      validCommit1.process.returns([validCommit1, true, []]);

      const invalidCommit = sinon.createStubInstance(CommitMessage);
      invalidCommit.process.returns([
        invalidCommit,
        false,
        [{ type: 'subject', filter: undefined, errors: ['Subject missing'], warnings: [] }],
      ]);
      invalidCommit.setStyle.returns(undefined);
      invalidCommit.style.returns(invalidCommit);
      invalidCommit.toString.returns('invalid');

      const validCommit2 = sinon.createStubInstance(CommitMessage);
      validCommit2.process.returns([validCommit2, true, []]);

      const fromStringStub = sinon.stub(CommitMessage, 'fromString');
      fromStringStub.onCall(0).returns(validCommit1);
      fromStringStub.onCall(1).returns(invalidCommit);
      fromStringStub.onCall(2).returns(validCommit2);

      await lintCmd('abc1234...def4567', {});

      expect(mockLogError.called).to.be.true;
      expect(mockExit.calledWith(1)).to.be.true;
    });
  });
});
