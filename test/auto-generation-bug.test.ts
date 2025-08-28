import TestGitRepo from './fixtures/TestGitRepo.js';
import CommitlintConfigBuilder from './fixtures/CommitlintConfigBuilder.js';
import Cliete from 'cliete';
import testHook from './fixtures/testHook.js';

describe('Auto-generation Bug Reproduction', () => {
  const ctx = testHook(() => {
    const repo = new TestGitRepo();
    new CommitlintConfigBuilder(repo).conventional().commitAsYaml();

    Cliete.setDefault('cwd', repo.tempDir);
    Cliete.setDefault('width', 120);
    Cliete.setDefault('height', 60);
    Cliete.setDefault('timeout', null);

    return [{ repo }, () => repo.teardown()];
  });

  it('should not duplicate commit type in subject when using --auto', async () => {
    // Stage some test files
    ctx.repo.addTsFile('test/example.test.ts', 'export const test = true;', { stage: true });

    // Run commitional --auto (this will fail initially, demonstrating the bug)
    const I = await Cliete.openTerminal('commitional --auto');

    // Expect to see the commit type only once in the final output
    // This regex ensures "test:" appears only once, not "test: test:"
    await I.wait.until.I.spot(/✔ test: (?!test:).*$/);

    await I.wait.for.the.process.to.exit.with.exit.code.zero;
  });

  it('should not duplicate feat type in subject when using --auto', async () => {
    // Stage some feature files
    ctx.repo.addTsFile('src/feature.ts', 'export const feature = true;', { stage: true });

    const I = await Cliete.openTerminal('commitional --auto');

    // Expect to see "feat:" only once
    await I.wait.until.I.spot(/✔ feat: (?!feat:).*$/);

    await I.wait.for.the.process.to.exit.with.exit.code.zero;
  });

  it('should not duplicate fix type in subject when using --auto', async () => {
    // Stage some bug fix files
    ctx.repo.addTsFile('src/bugfix.ts', 'export const fix = true;', { stage: true });

    const I = await Cliete.openTerminal('commitional --auto');

    // Expect to see "fix:" only once
    await I.wait.until.I.spot(/✔ fix: (?!fix:).*$/);

    await I.wait.for.the.process.to.exit.with.exit.code.zero;
  });
});
