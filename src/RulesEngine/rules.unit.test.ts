import { expect } from 'chai';
import CommitMessage from '../CommitMessage/index.js';
import RulesEngine from './index.js';

describe('Rules', () => {
  it('exists - should add extra footer when expected trailer does not exist', () => {
    const engine = RulesEngine.fromRules({
      'trailer-exists': [2, 'always', 'Signed-off-by'],
    });

    const commit = CommitMessage.fromJSON({ type: 'test', subject: 'check trailer rules work' });

    expect(commit.footers).to.deep.equal([]);

    const [errors, warnings] = engine.validate(commit, 'fix');
    expect(errors).to.be.empty;
    expect(warnings).to.be.empty;

    expect(commit.footers).to.deep.equal(['Signed-off-by: ']);
  });

  it('exists - should remove forbidden footer if it does exist', () => {
    const engine = RulesEngine.fromRules({
      'trailer-exists': [2, 'never', 'Signed-off-by'],
    });

    const commit = CommitMessage.fromJSON({
      type: 'test',
      subject: 'check trailer rules work',
      footers: ['Signed-off-by: me'],
    });
    expect(commit.footers).to.deep.equal(['Signed-off-by: me']);

    const [errors, warnings] = engine.validate(commit, 'fix');
    expect(errors).to.be.empty;
    expect(warnings).to.be.empty;

    expect(commit.footers).to.deep.equal([]);
  });

  it('footers-empty never - should pass when footers exist', () => {
    const engine = RulesEngine.fromRules({
      'footers-empty': [2, 'never'],
    });

    const commit = CommitMessage.fromJSON({ type: 'test', subject: 'check footers rules work', footers: ['Closes: #123'] });

    const [errors, warnings] = engine.validate(commit, 'validate');
    expect(errors).to.be.empty;
    expect(warnings).to.be.empty;
  });

  it('footers-empty never - should fail when footers are empty', () => {
    const engine = RulesEngine.fromRules({
      'footers-empty': [2, 'never'],
    });

    const commit = CommitMessage.fromJSON({ type: 'test', subject: 'check footers rules work' });

    const [errors, warnings] = engine.validate(commit, 'validate');
    expect(errors).to.have.length(1);
    expect(errors[0]).to.contain('footers');
    expect(errors[0]).to.contain('empty');
    expect(warnings).to.be.empty;
  });

  it('footer-empty never - should fail when footer values are empty', () => {
    const engine = RulesEngine.fromRules({
      'footer-empty': [2, 'never'],
    });

    const commit = CommitMessage.fromJSON({
      type: 'test',
      subject: 'check footers rules work',
      footers: ['Signed-off-by:'],
    });

    const [errors, warnings] = engine.validate(commit, 'validate');
    expect(errors).to.have.length(1);
    expect(errors[0]).to.contain('[footer:0]');
    expect(errors[0]).to.contain('empty');
    expect(warnings).to.be.empty;
  });

  it('footer-empty always - should fix footer values that contain values', () => {
    const engine = RulesEngine.fromRules({
      'footer-empty': [2, 'always'],
    });

    const commit = CommitMessage.fromJSON({
      type: 'test',
      subject: 'check footers rules work',
      footers: ['Signed-off-by: me'],
    });

    const [errors, warnings] = engine.validate(commit, 'fix');
    expect(errors).to.be.empty;
    expect(warnings).to.be.empty;

    expect(commit.footers).to.deep.equal([]);
  });

  it('footer-full-stop always - should fix footer that does not contain the full-stop character', () => {
    const engine = RulesEngine.fromRules({
      'footer-full-stop': [2, 'always', '.'],
    });

    const commit = CommitMessage.fromJSON({
      type: 'test',
      subject: 'check footers rules work',
      footers: ['Signed-off-by: me'],
    });

    const [errors, warnings] = engine.validate(commit, 'fix');
    expect(errors).to.be.empty;
    expect(warnings).to.be.empty;

    expect(commit.footers).to.deep.equal(['Signed-off-by: me.']);
  });

  it('scope-allow-multiple never - should not allow multiple scopes', () => {
    const engine = RulesEngine.fromRules({
      'scope-allow-multiple': [2, 'never', ','],
    });

    const commit = CommitMessage.fromJSON({ type: 'test', scope: 'api,ui', subject: 'test validation of multiple scopes' });

    const [errors, warnings] = engine.validate(commit, 'validate');
    expect(errors).to.have.length(1);
    expect(errors[0]).to.contain('[scope:1]');
    expect(warnings).to.be.empty;
  });

  it('scope-allow-multiple never - should fix multiple scopes by removing all bar the first scope', () => {
    const engine = RulesEngine.fromRules({
      'scope-allow-multiple': [2, 'never', ','],
    });

    const commit = CommitMessage.fromJSON({ type: 'test', scope: 'api,ui', subject: 'test fixing of multiple scopes' });

    const [errors, warnings] = engine.validate(commit, 'fix');
    expect(errors).to.be.empty;
    expect(warnings).to.be.empty;

    expect(commit.scope).to.deep.equal('api');
  });

  describe('type-case always - should validate type not in correct case', () => {
    [
      { case_rule: 'pascal-case' as const, type: 'feat type', fixed: 'FeatType' },
      { case_rule: 'snake-case' as const, type: 'feat Type', fixed: 'feat_type' },
    ].forEach(({ case_rule, type, fixed }) => {
      const engine = RulesEngine.fromRules({
        'type-case': [2, 'always', case_rule],
      });

      it(`${case_rule} - validate`, () => {
        const commit = CommitMessage.fromJSON({ type, subject: 'check that type case rules work' });

        const [errors, warnings] = engine.validate(commit, 'validate');
        expect(errors[0]).to.contain('[type:0]');
        expect(warnings).to.be.empty;
      });

      it(`${case_rule} - fix`, () => {
        const commit = CommitMessage.fromJSON({ type, subject: 'check that type case rules work' });

        const [errors, warnings] = engine.validate(commit, 'fix');
        expect(errors).to.be.empty;
        expect(warnings).to.be.empty;

        expect(commit.type).to.equal(fixed);
      });
    });
  });
});
