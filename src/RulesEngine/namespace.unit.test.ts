import RulesEngine from './index.js';
import CommitMessage from '../CommitMessage/index.js';
import { expect } from 'chai';

describe('RulesEngine - Namespace Rules', () => {
  describe('namespace-enum rule', () => {
    it('should validate namespace against enum values', () => {
      const rulesEngine = RulesEngine.fromRules({
        'namespace-enum': [2, 'always', ['myapp', 'shared']],
      });

      const validCommit = CommitMessage.fromString('[myapp] feat(auth): add login');
      const [errors] = rulesEngine.validate(validCommit, 'validate');
      expect(errors).to.be.empty;
    });

    it('should reject invalid namespace', () => {
      const rulesEngine = RulesEngine.fromRules({
        'namespace-enum': [2, 'always', ['myapp', 'shared']],
      });

      const invalidCommit = CommitMessage.fromString('[invalid] feat(auth): add login');
      const [errors] = rulesEngine.validate(invalidCommit, 'validate');
      expect(errors).to.have.length.greaterThan(0);
      expect(errors[0]).to.include('namespace');
    });
  });

  describe('namespace-empty rule', () => {
    it('should require namespace when set to never', () => {
      const rulesEngine = RulesEngine.fromRules({
        'namespace-empty': [2, 'never'],
      });

      const commitWithoutNamespace = CommitMessage.fromString('feat(auth): add login');
      const [errors] = rulesEngine.validate(commitWithoutNamespace, 'validate');
      expect(errors).to.have.length.greaterThan(0);
      expect(errors[0]).to.include('namespace');
    });

    it('should allow namespace when set to never', () => {
      const rulesEngine = RulesEngine.fromRules({
        'namespace-empty': [2, 'never'],
      });

      const commitWithNamespace = CommitMessage.fromString('[myapp] feat(auth): add login');
      const [errors] = rulesEngine.validate(commitWithNamespace, 'validate');
      expect(errors).to.be.empty;
    });

    it('should forbid namespace when set to always', () => {
      const rulesEngine = RulesEngine.fromRules({
        'namespace-empty': [2, 'always'],
      });

      const commitWithNamespace = CommitMessage.fromString('[myapp] feat(auth): add login');
      const [errors] = rulesEngine.validate(commitWithNamespace, 'validate');
      expect(errors).to.have.length.greaterThan(0);
      expect(errors[0]).to.include('namespace');
    });
  });

  describe('namespace integration', () => {
    it('should handle namespace getter/setter in commit parts', () => {
      const rulesEngine = RulesEngine.fromRules({
        'namespace-enum': [2, 'always', ['myapp']],
      });

      const commit = new CommitMessage();
      commit.type = 'feat';
      commit.namespace = 'myapp';
      commit.subject = 'add feature';

      const [errors] = rulesEngine.validate(commit, 'validate');
      expect(errors).to.be.empty;
    });
  });
});
