import Cliete from 'cliete';
import CommitlintConfigBuilder from './fixtures/CommitlintConfigBuilder';
import TestGitRepo from './fixtures/TestGitRepo';
import { expect } from 'chai';

class CliHelpers {
  constructor(private readonly cliete: Cliete) {}

  async addFooter(token: string, text: string) {
    const I = this.cliete;

    await I.press.down.until.I.spot('❯ add footer');
    await I.press.enter.and.wait.until.I.spot('footer token:');
    await I.type(token).and.press.enter.and.wait.until.I.spot(`${token}:`);
    await I.type(text).and.press.enter.and.wait.until.I.spot('? Commit or Edit');
  }

  async editFoooter(token: string, newText: string) {
    const I = this.cliete;

    await I.press.down.until.I.spot(`❯ ${token}`);
    await I.press.enter.and.wait.until.I.spot(`?  ${token}: `);
    await I.press.backspace.until.I.spot(new RegExp(`\\?  ${token}:$`));
    await I.type(newText).and.press.enter.and.wait.until.I.spot('? Commit or Edit');
  }

  async deleteFoooter(token: string) {
    const I = this.cliete;

    await I.press.down.until.I.spot(`❯ ${token}`);
    await I.press.enter.and.wait.until.I.spot(`${token}:`);
    await I.press.backspace.until.I.spot(new RegExp(`\\?  ${token}:$`));
    await I.press.enter.and.wait.until.I.spot('? Commit or Edit');
  }
}

describe('Interactive Commit Flow', () => {
  let repo: TestGitRepo;

  before(() => {
    repo = new TestGitRepo();
    new CommitlintConfigBuilder(repo)
      .typeEnum(['feat', 'fix', 'docs'])
      .typeEmpty('never')
      .subjectCase('sentence-case')
      .subjectEmpty('never')
      .subjectFullStop('never')
      .commitAsYaml();

    Cliete.setDefaults({
      width: 100,
      height: 30,
      cwd: repo.tempDir,
    });
  });

  after(() => {
    repo.teardown();
  });

  beforeEach(() => {
    // Ensure we have staged changes, otherwise the cli with short circuit.
    repo.addJsFile('test', `console.log("Random number today is: ${Math.random()}");`, { stage: true });
  });

  it('should allow a user to create a basic commit', async () => {
    const I = await Cliete.openTerminal('commitional');

    await I.spot("Select the type of change that you're committing:");
    await I.spot('❯ feat');
    await I.spot('fix');
    await I.spot('docs');

    // Select docs
    await I.press.down.twice.and.wait.until.I.spot('❯ docs');

    await I.press.enter.and.wait.until.I.spot('If applied, this commit will...');
    // Subject commit rules will enforce Sentence case and no trailing full stop
    await I.type('TEST INPUTTING IN A SUBJECT.').and.wait.until.I.spot('Test inputting in a subject');

    await I.press.enter.and.wait.until.I.spot('Does this change introduce any breaking changes? (Y/n)');

    await I.type('n').and.press.enter.and.wait.until.I.spot('docs: Test inputting in a subject');
    await I.spot('❯ Commit');

    await I.press.enter.and.wait.until.I.spot(/[a-f0-9]{40}$/m); // A commit hash
    await I.wait.for.the.process.to.exit.with.exit.code.zero;
  });

  it('should allow a user to create an advanced commit', async () => {
    const I = await Cliete.openTerminal('commitional');

    await I.wait.until.I.spot('❯ feat');

    // TODO: Scope

    await I.press.enter.and.wait.until.I.spot('If applied, this commit will...');

    // TODO: Body

    // TODO: Footers

    await I.type('new feature').and.press.enter.and.wait.until.I.spot(
      'Does this change introduce any breaking changes? (Y/n)',
    );

    await I.type('n').and.press.enter.and.wait.until.I.spot('feat: New feature');
    await I.spot('❯ Commit');

    await I.press.enter.and.wait.until.I.spot(/[a-f0-9]{40}$/m); // A commit hash
    await I.wait.for.the.process.to.exit.with.exit.code.zero;
  });

  it('should allow a user to edit a commit', async () => {
    const I = await Cliete.openTerminal('commitional --type feat --subject "Edit commits" --no-breaking');

    const cli = new CliHelpers(I);

    await I.see(
      '------------',
      'feat: Edit commits',
      '',
      '',
      '? Commit or Edit',
      '❯ Commit',
      '──────────────',
      'type',
      'scope',
      'subject',
      'body',
      'add footer',
      '(Use arrow keys to reveal more choices)',
    );

    // Edit type
    await I.press.down.and.wait.until.I.spot('❯ type');
    await I.press.enter.and.wait.until.I.spot('❯ feat');
    await I.press.down.and.wait.until.I.spot('❯ fix');
    await I.press.enter.and.wait.until.I.spot('fix: Edit commits');

    // Edit scope
    await I.press.down.until.I.spot('❯ scope');
    await I.press.enter.and.wait.until.I.spot('? Scope of the change');
    await I.type('test').and.press.enter.and.wait.until.I.spot('fix(test): Edit commits');

    // Edit subject
    await I.press.down.until.I.spot('❯ subject');
    await I.press.enter.and.wait.until.I.spot('If applied, this commit will...');
    await I.press.backspace.nth('Edit commits'.length + 1).and.wait.until.I.spot(/\.\.\.$/);
    await I.type('Updated subject').and.press.enter.and.wait.until.I.spot('fix(test): Updated subject');

    // TODO: Need to interact with a spawned process, how?
    // Edit body
    // await I.press.down.until.I.spot('❯ body');
    // await I.press.enter.and.wait.until.I.spot('Provide a longer description');
    // await I.type('This is the body content').and.press.enter.and.wait.until.I.spot('This is the body content');

    // Add footer
    await cli.addFooter('Closes', '#123');
    await I.spot(
      [
        '------------',
        'fix(test): Updated subject',
        '',
        'Closes: #123',
        '',
        '',
        '? Commit or Edit',
        '❯ Commit',
        '──────────────',
        'type',
        'scope',
        'subject',
        'body',
        'add footer',
        '(Use arrow keys to reveal more choices)',
      ].join('\n'),
    );

    await cli.addFooter('Signed-off-by', 'me (lol)');
    await I.spot(
      [
        '------------',
        'fix(test): Updated subject',
        '',
        'Closes: #123',
        '',
        'Signed-off-by: me (lol)',
        '',
        '',
        '? Commit or Edit',
        '❯ Commit',
        '──────────────',
        'type',
        'scope',
        'subject',
        'body',
        'add footer',
        '(Use arrow keys to reveal more choices)',
      ].join('\n'),
    );

    // Edit footer after creation
    await cli.editFoooter('Closes', '#456');
    await I.spot(
      [
        '------------',
        'fix(test): Updated subject',
        '',
        'Closes: #456',
        '',
        'Signed-off-by: me (lol)',
        '',
        '',
        '? Commit or Edit',
        '❯ Commit',
        '──────────────',
        'type',
        'scope',
        'subject',
        'body',
        'add footer',
        '(Use arrow keys to reveal more choices)',
      ].join('\n'),
    );

    // Delete footer after creation
    await cli.deleteFoooter('Signed-off-by');
    await I.spot(
      [
        '------------',
        'fix(test): Updated subject',
        '',
        'Closes: #456',
        '',
        '',
        '? Commit or Edit',
        '❯ Commit',
        '──────────────',
        'type',
        'scope',
        'subject',
        'body',
        'add footer',
        '(Use arrow keys to reveal more choices)',
      ].join('\n'),
    );

    // Commit the changes
    await I.press.enter.and.wait.until.I.spot(/[a-f0-9]{40}$/m);
    await I.wait.for.the.process.to.exit.with.exit.code.zero;

    // check that this is in our commits.
    const lastCommit = repo.lastCommit;
    expect(lastCommit).to.exist;

    // Check that our lastCommit hash is indeed printed on the screen
    await I.spot(lastCommit);
  });
});
