import { expect } from 'chai';
import RulesEngine from './index.js';

describe('RulesEngine', () => {
  describe('description()', () => {
    const rules = RulesEngine.fromConfig({
      'body-max-line-length': [2, 'always', 72],
      'subject-case': [2, 'always', 'sentence-case'],
      'subject-empty': [2, 'never'],
      'subject-full-stop': [2, 'never', '.'],
      'subject-max-length': [2, 'always', 72],
      'subject-min-length': [2, 'always', 5],
      'scope-empty': [2, 'always'],
      'type-empty': [2, 'never'],
      'type-enum': [2, 'always', ['feat', 'chore', 'fix', 'docs', 'style', 'test', 'build', 'ci']],
    });

    it('should describe in plain english the rules the engine enforces.', () => {
      expect(rules.describe()).to.equal(`## General Rules
Commit messages must have a subject and type, may have a body, footer, header or trailer and must not contain a scope
### Type
- The type can only be one of: 'feat', 'chore', 'fix', 'docs', 'style', 'test', 'build' or 'ci'
### Subject
- The subject must always be in Sentence case
- The subject must not end with a full stop
- The subject must not exceed 72 characters
- The subject must be at least 5 characters
- The subject must be written in imperative mood (Fix, not Fixed / Fixes etc.)
### Body
- The body must be wrapped at 72 characters`);
    });
  });
});
