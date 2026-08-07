import { expect } from 'chai';
import sinon from 'sinon';
import PromptFlow from '../PromptFlow/index.js';
import RulesEngine from '../RulesEngine/index.js';
import Diff from '../services/Git/Diff.js';
import Git, { type GitCommitResult, type GitPushResult } from '../services/Git/index.js';
import { Provider } from './create.js';

describe('Create Cmd namespace population', () => {
  let mockGit: sinon.SinonStubbedInstance<Git>;

  beforeEach(() => {
    mockGit = sinon.createStubInstance(Git);
    mockGit.isRepository.resolves(true);
    mockGit.commit.resolves({ success: true, commitHash: 'commit-hash' });
    sinon.stub(PromptFlow.prototype, 'prompt').callsFake(function (this: object) {
      const flow = this as unknown as { config?: { banner?: (choice: { value: string }) => unknown } };
      flow.config?.banner?.({ value: 'Commit' });
      return Promise.resolve();
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  async function createCommit(files: string[], namespace?: string) {
    mockGit.stagedDiff.resolves(new Diff(Object.fromEntries(files.map(file => [file, 'diff']))));

    const rulesEngine = RulesEngine.fromRules({
      'namespace-enum': [2, 'always', ['api', 'web']],
    } as never);

    const create = Provider({
      git: mockGit,
      rulesEngine,
      log: sinon.stub(),
    });

    await create({
      auto: false,
      breaking: false,
      type: 'feat',
      subject: 'Test namespace population',
      ...(namespace === undefined ? {} : { namespace }),
    });

    return mockGit.commit.firstCall.args[0];
  }

  it('populates the namespace for files with one resolved namespace', async () => {
    const message = await createCommit(['api/test.js']);

    expect(message).to.equal('[api] feat: Test namespace population');
  });

  it('preserves an explicitly supplied namespace over the resolved namespace', async () => {
    const message = await createCommit(['api/test.js'], 'custom');

    expect(message).to.equal('[custom] feat: Test namespace population');
  });

  it('leaves the namespace empty when no namespace is resolved', async () => {
    const message = await createCommit(['root.js']);

    expect(message).to.equal('feat: Test namespace population');
  });

  it('leaves the namespace empty when multiple namespaces are resolved', async () => {
    const message = await createCommit(['api/test.js', 'web/test.js']);

    expect(message).to.equal('feat: Test namespace population');
  });

  type CreateOptions = {
    stagedFiles?: string[];
    commitResult?: GitCommitResult;
    pushResult?: GitPushResult;
    push?: boolean;
  };

  async function runCreate({
    stagedFiles = ['src/test.js'],
    commitResult = { success: true, commitHash: 'commit-hash' },
    pushResult = { success: true, branch: 'main', remote: 'origin' },
    push,
  }: CreateOptions = {}) {
    mockGit.stagedDiff.resolves(new Diff(Object.fromEntries(stagedFiles.map(file => [file, 'diff']))));
    mockGit.commit.resolves(commitResult);
    mockGit.push.resolves(pushResult);

    const log = sinon.stub();
    const create = Provider({
      git: mockGit,
      rulesEngine: RulesEngine.fromRules({}),
      log,
    });

    await create({
      auto: false,
      breaking: false,
      type: 'feat',
      subject: 'Test auto push',
      ...(push === undefined ? {} : { push }),
    });

    return { log };
  }

  function capturedOutput(write: sinon.SinonStub): string {
    return write.args.map(([chunk]) => String(chunk)).join('');
  }

  it('does not commit or push when no files are staged, even when auto-push is enabled', async () => {
    const { log } = await runCreate({ stagedFiles: [], push: true });

    expect(mockGit.commit.called).to.equal(false);
    expect(mockGit.push.called).to.equal(false);
    expect(log.calledWithMatch('No files staged to commit')).to.equal(true);
  });

  it('does not push when the commit fails', async () => {
    await runCreate({
      commitResult: { success: false, error: new Error('commit failed') },
      push: true,
    });

    expect(mockGit.commit.calledOnce).to.equal(true);
    expect(mockGit.push.called).to.equal(false);
  });

  it('pushes exactly once after an enabled successful commit', async () => {
    await runCreate({ push: true });

    expect(mockGit.commit.calledOnce).to.equal(true);
    expect(mockGit.push.calledOnce).to.equal(true);
  });

  it('does not push after a disabled successful commit', async () => {
    await runCreate({ push: false });

    expect(mockGit.commit.calledOnce).to.equal(true);
    expect(mockGit.push.called).to.equal(false);
  });

  it('reports the branch and remote when pushing succeeds', async () => {
    const write = sinon.stub(process.stderr, 'write');

    await runCreate({
      push: true,
      pushResult: { success: true, branch: 'feature/auto-push', remote: 'upstream' },
    });

    expect(capturedOutput(write)).to.include('Pushed feature/auto-push to upstream');
  });

  for (const [description, errorMessage] of [
    ['a push failure', 'remote rejected the update'],
    ['a missing remote', 'No remote is configured for this repository'],
  ] as const) {
    it(`reports ${description} and retains the successful commit`, async () => {
      const write = sinon.stub(process.stderr, 'write');

      await runCreate({
        push: true,
        pushResult: { success: false, error: new Error(errorMessage) },
      });

      expect(mockGit.commit.calledOnce).to.equal(true);
      expect(mockGit.push.calledOnce).to.equal(true);
      expect(capturedOutput(write)).to.include(errorMessage);
    });
  }
});
