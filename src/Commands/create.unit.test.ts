import { expect } from 'chai';
import sinon from 'sinon';
import PromptFlow from '../PromptFlow/index.js';
import RulesEngine from '../RulesEngine/index.js';
import Diff from '../services/Git/Diff.js';
import Git from '../services/Git/index.js';
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
});
