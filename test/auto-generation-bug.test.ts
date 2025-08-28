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

    // Run commitional --auto
    const I = await Cliete.openTerminal('commitional --auto');

    // Should NOT see duplicated type like "test: test:" or "feat: feat:"
    await I.wait.until.I.spot(/✔ \w+: (?!\w+:)/);

    await I.press.ctrlC.and.wait.for.the.process.to.exit.with.exit.code.zero;
  });

  it('should not duplicate feat type in subject when using --auto', async () => {
    // Stage some feature files
    ctx.repo.addTsFile('src/feature.ts', 'export const feature = true;', { stage: true });

    const I = await Cliete.openTerminal('commitional --auto');

    // Should NOT see duplicated type
    await I.wait.until.I.spot(/✔ \w+: (?!\w+:)/);

    await I.press.ctrlC.and.wait.for.the.process.to.exit.with.exit.code.zero;
  });

  it('should not duplicate fix type in subject when using --auto', async () => {
    // Stage some bug fix files
    ctx.repo.addTsFile('src/bugfix.ts', 'export const fix = true;', { stage: true });

    const I = await Cliete.openTerminal('commitional --auto');

    // Should NOT see duplicated type
    await I.wait.until.I.spot(/✔ \w+: (?!\w+:)/);

    await I.press.ctrlC.and.wait.for.the.process.to.exit.with.exit.code.zero;
  });
});
