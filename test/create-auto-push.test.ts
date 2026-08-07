import { execSync } from 'node:child_process';
import { expect } from 'chai';
import Cliete from 'cliete';
import CommitlintConfigBuilder from './fixtures/CommitlintConfigBuilder';
import TestGitRepo from './fixtures/TestGitRepo';

describe('CLI auto-push E2E Tests', () => {
  let repo: TestGitRepo;

  before(() => {
    Cliete.setDefaults({ width: 100, height: 30 });
  });

  beforeEach(() => {
    repo = new TestGitRepo();
    new CommitlintConfigBuilder(repo).typeEnum(['custom']).typeEmpty('never').commitAsYaml();
  });

  afterEach(() => {
    repo.teardown();
  });

  function environment(autoPush?: string): Record<string, string> {
    const env: Record<string, string> = {};

    for (const [key, value] of Object.entries(process.env)) {
      if (key !== 'COMMITIONAL_AUTO_PUSH' && value !== undefined) env[key] = value;
    }

    if (autoPush !== undefined) env.COMMITIONAL_AUTO_PUSH = autoPush;

    return env;
  }

  function stageChange(withRemote: boolean): string[] {
    if (withRemote) repo.addBareRemote().setUpstream();

    repo.addJsFile('test', 'console.log("test");', { stage: true });
    return repo.remoteCommits;
  }

  function branchName(): string {
    return execSync('git branch --show-current', { cwd: repo.tempDir }).toString().trim();
  }

  async function completeCommit(command: string, env = environment()): Promise<Cliete> {
    const I = await Cliete.openTerminal(command, {
      cwd: repo.tempDir,
      env,
    });

    await I.wait.until.I.spot('? Commit or Edit');
    await I.press.enter.and.wait.for.the.process.to.exit.with.exit.code.zero;

    return I;
  }

  it('pushes the new commit with --push to the configured bare remote', async () => {
    const remoteBefore = stageChange(true);
    const branch = branchName();

    const I = await completeCommit("commitional --push --type custom --subject 'push commit' --no-breaking");

    await I.spot(`Pushed ${branch} to origin`);
    expect(repo.lastCommit).not.to.equal(remoteBefore[remoteBefore.length - 1]);
    expect(repo.remoteCommits).to.include(repo.lastCommit);
  });

  it('commits locally without pushing by default', async () => {
    const remoteBefore = stageChange(true);

    const I = await completeCommit("commitional --type custom --subject 'local commit' --no-breaking");

    const screen = await I.printScreen();
    expect(screen).not.to.include('Pushed ');
    expect(repo.lastCommit).not.to.equal(remoteBefore[remoteBefore.length - 1]);
    expect(repo.remoteCommits).to.deep.equal(remoteBefore);
  });

  it('lets --no-push override COMMITIONAL_AUTO_PUSH=true', async () => {
    const remoteBefore = stageChange(true);

    const I = await completeCommit(
      "commitional --no-push --type custom --subject 'opt out commit' --no-breaking",
      environment('true'),
    );

    const screen = await I.printScreen();
    expect(screen).not.to.include('Pushed ');
    expect(repo.lastCommit).not.to.equal(remoteBefore[remoteBefore.length - 1]);
    expect(repo.remoteCommits).to.deep.equal(remoteBefore);
  });

  it('pushes the new commit when COMMITIONAL_AUTO_PUSH=true is set without a flag', async () => {
    const remoteBefore = stageChange(true);
    const branch = branchName();

    const I = await completeCommit(
      "commitional --type custom --subject 'environment push commit' --no-breaking",
      environment('true'),
    );

    await I.spot(`Pushed ${branch} to origin`);
    expect(repo.lastCommit).not.to.equal(remoteBefore[remoteBefore.length - 1]);
    expect(repo.remoteCommits).to.include(repo.lastCommit);
  });

  it('retains the commit and reports the missing remote when auto-push has no remote', async () => {
    stageChange(false);

    const I = await completeCommit("commitional --push --type custom --subject 'missing remote commit' --no-breaking");

    await I.spot('No remote is configured for this repository');
    expect(repo.commits).to.include(repo.lastCommit);
  });
});
