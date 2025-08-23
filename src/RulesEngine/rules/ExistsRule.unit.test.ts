import { expect } from 'chai';
import { ExistsRule } from './ExistsRule.js';
import { RuleConfigSeverity } from './BaseRule.js';

describe('ExistsRule', () => {
  describe('Constructor', () => {
    it('should convert single string value to array', () => {
      const rule = new ExistsRule('type', RuleConfigSeverity.Error, 'always', 'feat');
      expect(rule.value).to.deep.equal(['feat']);
    });

    it('should preserve array value as-is', () => {
      const rule = new ExistsRule('scope', RuleConfigSeverity.Error, 'always', ['api', 'ui']);
      expect(rule.value).to.deep.equal(['api', 'ui']);
    });

    it('should set properties correctly', () => {
      const rule = new ExistsRule('type', RuleConfigSeverity.Warning, 'never', 'feat');
      expect(rule.scope).to.equal('type');
      // biome-ignore lint/suspicious/noExplicitAny: masking as any to get around 'protected' property type
      expect((rule as any).level).to.equal(RuleConfigSeverity.Warning);
      expect(rule.applicable).to.equal('never');
    });
  });

  describe('validate() - Positive Cases (Valid Commits)', () => {
    it('should validate when type exists (always)', () => {
      const rule = new ExistsRule('type', RuleConfigSeverity.Error, 'always', 'feat');
      expect(rule.validate(['feat'])).to.be.null;
    });

    it('should validate when subject exists (always)', () => {
      const rule = new ExistsRule('subject', RuleConfigSeverity.Error, 'always', 'add feature');
      expect(rule.validate(['add feature'])).to.be.null;
    });

    it('should validate when body exists (always)', () => {
      const rule = new ExistsRule('body', RuleConfigSeverity.Error, 'always', 'detailed description');
      expect(rule.validate(['detailed description'])).to.be.null;
    });

    it('should validate when scope exists (always)', () => {
      const rule = new ExistsRule('scope', RuleConfigSeverity.Error, 'always', ['api', 'ui']);
      expect(rule.validate(['api', 'ui'])).to.be.null;
    });

    it('should validate when footer exists (always)', () => {
      const rule = new ExistsRule('footer', RuleConfigSeverity.Error, 'always', ['#123']);
      expect(rule.validate(['#123'])).to.be.null;
    });

    it('should validate when trailer exists (always)', () => {
      const rule = new ExistsRule('trailer', RuleConfigSeverity.Error, 'always', ['Closes']);
      expect(rule.validate(['Closes'])).to.be.null;
    });
  });

  describe('validate() - Invalid Commits', () => {
    it('should invalidate when type missing (always)', () => {
      const rule = new ExistsRule('type', RuleConfigSeverity.Error, 'always', 'feat');
      expect(rule.validate(['docs'])).to.deep.equal({ 0: `The type 'feat' must always exist` });
    });

    it('should invalidate when subject missing (always)', () => {
      const rule = new ExistsRule('subject', RuleConfigSeverity.Error, 'always', 'add feature');
      expect(rule.validate(['fix bug'])).to.deep.equal({ 0: `The subject 'add feature' must always exist` });
    });

    it('should invalidate when body missing (always)', () => {
      const rule = new ExistsRule('body', RuleConfigSeverity.Error, 'always', 'detailed description');
      expect(rule.validate(['short desc'])).to.deep.equal({ 0: `The body 'detailed description' must always exist` });
    });

    it('should invalidate when scope missing (always)', () => {
      const rule = new ExistsRule('scope', RuleConfigSeverity.Error, 'always', ['api', 'ui']);
      expect(rule.validate(['ui'])).to.deep.equal({ 0: `The scopes 'api', 'ui' must always exist` });
    });

    it('should invalidate when footer missing (always)', () => {
      const rule = new ExistsRule('footer', RuleConfigSeverity.Error, 'always', ['#123']);
      expect(rule.validate(['#456'])).to.deep.equal({ 0: `The footer '#123' must always exist` });
    });

    it('should invalidate when trailer missing (always)', () => {
      const rule = new ExistsRule('trailer', RuleConfigSeverity.Error, 'always', ['Closes']);
      expect(rule.validate(['Signed-off-by'])).to.deep.equal({ 0: `The trailer 'Closes' must always exist` });
    });
  });

  describe('validate() - Never Cases', () => {
    it('should validate when forbidden type absent (never)', () => {
      const rule = new ExistsRule('type', RuleConfigSeverity.Error, 'never', 'feat');
      expect(rule.validate(['docs'])).to.be.null;
    });

    it('should not validate when forbidden type present (never)', () => {
      const rule = new ExistsRule('type', RuleConfigSeverity.Error, 'never', 'feat');
      expect(rule.validate(['feat'])).to.deep.equal({ 0: `Forbidden value: 'feat' - The type 'feat' must never exist` });
    });
  });

  describe('fix() - Positive Cases (Can Fix)', () => {
    it('should add missing type (always)', () => {
      const rule = new ExistsRule('type', RuleConfigSeverity.Error, 'always', 'feat');
      const [errors, fixed] = rule.fix(['docs']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['docs', 'feat']);
    });

    it('should add missing subject (always)', () => {
      const rule = new ExistsRule('subject', RuleConfigSeverity.Error, 'always', 'add feature');
      const [errors, fixed] = rule.fix(['fix bug']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['fix bug', 'add feature']);
    });

    it('should add missing body (always)', () => {
      const rule = new ExistsRule('body', RuleConfigSeverity.Error, 'always', 'detailed description');
      const [errors, fixed] = rule.fix(['short']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['short', 'detailed description']);
    });

    it('should add missing scope (always)', () => {
      const rule = new ExistsRule('scope', RuleConfigSeverity.Error, 'always', ['api']);
      const [errors, fixed] = rule.fix(['ui']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['ui', 'api']);
    });

    it('should add missing footer (always)', () => {
      const rule = new ExistsRule('footer', RuleConfigSeverity.Error, 'always', ['#123']);
      const [errors, fixed] = rule.fix(['#456']);
      expect(errors).to.be.null;
      expect(fixed).to.include('#123');
    });

    it('should add missing trailer (always)', () => {
      const rule = new ExistsRule('trailer', RuleConfigSeverity.Error, 'always', ['Closes']);
      const [errors, fixed] = rule.fix(['Signed-off-by']);
      expect(errors).to.be.null;
      expect(fixed).to.include('Closes');
    });
  });

  describe('fix() - Negative Cases (Already Valid)', () => {
    it('should return null when type already exists (always)', () => {
      const rule = new ExistsRule('type', RuleConfigSeverity.Error, 'always', 'feat');
      const [errors, fixed] = rule.fix(['feat']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['feat']);
    });

    it('should return null when subject already exists (always)', () => {
      const rule = new ExistsRule('subject', RuleConfigSeverity.Error, 'always', 'add feature');
      const [errors, fixed] = rule.fix(['add feature']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['add feature']);
    });
  });

  describe('fix() - Never Cases', () => {
    it('should remove forbidden type (never)', () => {
      const rule = new ExistsRule('type', RuleConfigSeverity.Error, 'never', 'feat');
      const [errors, fixed] = rule.fix(['feat']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal([]);
    });

    it('should remove forbidden scope (never)', () => {
      const rule = new ExistsRule('scope', RuleConfigSeverity.Error, 'never', ['api']);
      const [errors, fixed] = rule.fix(['api', 'ui']);
      expect(errors).to.be.null;
      expect(fixed).to.deep.equal(['ui']);
    });
  });
});
