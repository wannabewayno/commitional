import { expect } from 'chai';
import RulesEngine from './index.js';
import sinon from 'sinon';
import { RuleConfigSeverity } from '@commitlint/types';
import { EmptyRule } from './rules/EmptyRule.js';
import { MaxLengthRule } from './rules/MaxLengthRule.js';
import { CaseRule } from './rules/CaseRule.js';
import { AllowMultipleRule } from './rules/AllowMultipleRule.js';
import { MaxLineLengthRule } from './rules/MaxLineLengthRule.js';
import { MinLengthRule } from './rules/MinLengthRule.js';
import { FullStopRule } from './rules/FullStopRule.js';
import { EnumRule } from './rules/EnumRule.js';
import { TrimRule } from './rules/TrimRule.js';
import { LeadingBlankRule } from './rules/LeadingBlankRule.js';
import { ExclamationMarkRule } from './rules/ExclamationMarkRule.js';
import CommitMessage from '../CommitMessage/index.js';

describe('RulesEngine', () => {
  describe('description()', () => {
    const rules = RulesEngine.fromRules({
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
      expect(rules.describe()).to.equal(`## Commit message standard
Commit messages must have a subject and type, may have a body or footers and must not contain a scope
\`\`\`txt
<type>: <subject>

[optional body]

[optional: footer(s)]
\`\`\`

## General Rules
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

describe('RulesEngine', () => {
  describe('constructor', () => {
    it('should create an instance with provided rules', () => {
      const rules = {
        'type-empty': new EmptyRule('type', RuleConfigSeverity.Error, 'never'),
      };
      const engine = new RulesEngine(rules);
      expect(engine).to.be.instanceOf(RulesEngine);
    });
  });

  describe('validate', () => {
    it('should return true when input passes all rules', () => {
      const mockRule = {
        scope: 'type',
        check: sinon.stub().returns(['valid input', null, null]),
      };
      const engine = new RulesEngine({ 'type-empty': mockRule as unknown as EmptyRule });
      expect(engine.validate(CommitMessage.fromJSON({ subject: 'valid input' }))).to.deep.equal([[], []]);
    });

    it('should return false when input fails a rule', () => {
      const mockRule = {
        scope: 'type',
        check: sinon.stub().returns(['invalid input', { 0: 'failed' }, null]),
      };
      const engine = new RulesEngine({ 'type-empty': mockRule as unknown as EmptyRule });
      expect(engine.validate(CommitMessage.fromJSON({ subject: 'invalid input' }), 'validate')).to.deep.equal([
        ['[type:0] failed'],
        [],
      ]);
    });
  });

  describe('getRulesOfType', () => {
    it('should return rules of the specified type', () => {
      const emptyRule = new EmptyRule('type', RuleConfigSeverity.Error, 'never');
      const maxLengthRule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 100);
      const minLengthRule = new MinLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const enumRule = new EnumRule('type', RuleConfigSeverity.Error, 'always', ['feat', 'fix', 'docs']);

      const engine = new RulesEngine({
        'type-empty': emptyRule,
        'type-enum': enumRule,
        'subject-max-length': maxLengthRule,
        'subject-min-length': minLengthRule,
      });

      const emptyRules = engine.getRulesOfType('empty');
      expect(emptyRules).to.have.lengthOf(1);
      expect(emptyRules[0]).to.equal(emptyRule);
    });

    it('should return rules of the specified types', () => {
      const emptyRule = new EmptyRule('type', RuleConfigSeverity.Error, 'never');
      const maxLengthRule = new MaxLengthRule('subject', RuleConfigSeverity.Error, 'always', 100);
      const minLengthRule = new MinLengthRule('subject', RuleConfigSeverity.Error, 'always', 5);
      const enumRule = new EnumRule('type', RuleConfigSeverity.Error, 'always', ['feat', 'fix', 'docs']);

      const engine = new RulesEngine({
        'type-empty': emptyRule,
        'type-enum': enumRule,
        'subject-max-length': maxLengthRule,
        'subject-min-length': minLengthRule,
      });

      const rules = engine.getRulesOfType('empty', 'enum');
      expect(rules).to.have.lengthOf(2);
      expect(rules[0]).to.equal(emptyRule);
      expect(rules[1]).to.equal(enumRule);
    });

    it('should return empty array when no rules of the specified type exist', () => {
      const engine = new RulesEngine({
        'subject-empty': new EmptyRule('subject', RuleConfigSeverity.Error, 'never'),
        'type-enum': new EnumRule('type', RuleConfigSeverity.Error, 'always', ['feat', 'fix', 'docs']),
      });

      // Only contains rules for subject
      const narrowed = engine.narrow('subject');

      // enum won't exist as it was associated with type and that has been filtered out.
      const enumRules = narrowed.getRulesOfType('enum');
      expect(enumRules).to.have.lengthOf(0);
    });
  });

  describe('narrow', () => {
    it('should return a new engine with rules for the specified part', () => {
      const typeEmptyRule = new EmptyRule('type', RuleConfigSeverity.Error, 'never');
      const subjectEmptyRule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');

      const engine = new RulesEngine({
        'type-empty': typeEmptyRule,
        'subject-empty': subjectEmptyRule,
      });

      const narrowedEngine = engine.narrow('type');
      expect(narrowedEngine).to.be.instanceOf(RulesEngine);
      expect(narrowedEngine.getRulesOfType('empty')).to.have.lengthOf(1);
      expect(narrowedEngine.getRulesOfType('empty')[0]).to.equal(typeEmptyRule);
    });

    it('should return an empty engine when no rules match the specified part', () => {
      const subjectEmptyRule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');

      const engine = new RulesEngine({
        'subject-empty': subjectEmptyRule,
      });

      const narrowedEngine = engine.narrow('type');
      expect(narrowedEngine).to.be.instanceOf(RulesEngine);
      expect(narrowedEngine.getRulesOfType('empty')).to.have.lengthOf(0);
    });
  });

  describe('validate', () => {
    it('should apply fixes from rules', () => {
      const mockRule = {
        check: sinon.stub().returns(['fixed input', null, null]),
      };
      const engine = new RulesEngine({ 'type-empty': mockRule as unknown as EmptyRule });
      expect(engine.validate(CommitMessage.fromJSON({ subject: 'input' }))).to.deep.equal([[], []]);
    });

    it('should apply multiple fixes in sequence', () => {
      const mockRule1 = {
        check: sinon.stub().returns(['first fix', null, null]),
      };
      const mockRule2 = {
        check: sinon.stub().returns(['second fix', null, null]),
      };
      const engine = new RulesEngine({
        'type-empty': mockRule1 as unknown as EmptyRule,
        'type-case': mockRule2 as unknown as CaseRule,
      });
      expect(engine.validate(CommitMessage.fromJSON({ subject: 'input' }))).to.deep.equal([[], []]);
    });

    it('should collect both errors and warnings', () => {
      const mockRule1 = {
        scope: 'Rule1Scope',
        check: sinon.stub().returns([['input'], null, { 0: 'Warning message' }]),
      };
      const mockRule2 = {
        scope: 'Rule2Scope',
        check: sinon.stub().returns([['input'], { 0: 'Error message' }, null]),
      };
      const engine = new RulesEngine({
        'type-empty': mockRule1 as unknown as EmptyRule,
        'type-case': mockRule2 as unknown as CaseRule,
      });
      // console.log(engine.validate(CommitMessage.fromJSON({ subject: 'input' })))
      expect(engine.validate(CommitMessage.fromJSON({ subject: 'input' }))).to.deep.equal([
        ['[Rule2Scope:0] Error message'],
        ['[Rule1Scope:0] Warning message'],
      ]);
    });
  });

  describe('describe', () => {
    it('should generate a description of the rules', () => {
      const typeEmptyRule = new EmptyRule('type', RuleConfigSeverity.Error, 'never');
      const subjectEmptyRule = new EmptyRule('subject', RuleConfigSeverity.Error, 'never');

      const engine = new RulesEngine({
        'type-empty': typeEmptyRule,
        'subject-empty': subjectEmptyRule,
      });

      const description = engine.describe();
      expect(description).to.be.a('string');
      expect(description).to.include('General Rules');
      expect(description).to.include('type');
      expect(description).to.include('subject');
    });
  });

  describe('fromConfig', () => {
    it('should create a RulesEngine from a commitlint config', () => {
      const config = {
        'type-empty': [RuleConfigSeverity.Error, 'never'],
        'subject-max-length': [RuleConfigSeverity.Error, 'always', 100],
      } as const;

      const engine = RulesEngine.fromRules(config);
      expect(engine).to.be.instanceOf(RulesEngine);

      const emptyRules = engine.getRulesOfType('empty');
      expect(emptyRules).to.have.lengthOf(1);

      const maxLengthRules = engine.getRulesOfType('max-length');
      expect(maxLengthRules).to.have.lengthOf(1);
    });

    it('should ignore disabled rules', () => {
      const config = {
        'type-empty': [RuleConfigSeverity.Disabled, 'never'],
        'subject-max-length': [RuleConfigSeverity.Error, 'always', 100],
      } as const;

      const engine = RulesEngine.fromRules(config);
      const emptyRules = engine.getRulesOfType('empty');
      expect(emptyRules).to.have.lengthOf(0);
    });

    it('should handle undefined rule configs', () => {
      const config = {
        'type-empty': undefined,
        'subject-max-length': [RuleConfigSeverity.Error, 'always', 100],
      } as const;

      const engine = RulesEngine.fromRules(config);
      const emptyRules = engine.getRulesOfType('empty');
      expect(emptyRules).to.have.lengthOf(0);
    });
  });

  describe('createRule', () => {
    describe('Rules with Values', () => {
      describe('allow-multiple', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'allow-multiple', [RuleConfigSeverity.Error, 'always', ',']);
          expect(rule).to.be.instanceOf(AllowMultipleRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'allow-multiple', [RuleConfigSeverity.Error, 'never', ',']);
          expect(rule).to.be.instanceOf(AllowMultipleRule);
        });
      });

      describe('case', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'case', [RuleConfigSeverity.Error, 'always', 'sentence-case']);
          expect(rule).to.be.instanceOf(CaseRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'case', [RuleConfigSeverity.Error, 'never', 'sentence-case']);
          expect(rule).to.be.instanceOf(CaseRule);
        });
      });

      describe('enum', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'enum', [RuleConfigSeverity.Error, 'always', ['feat', 'fix']]);
          expect(rule).to.be.instanceOf(EnumRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'enum', [RuleConfigSeverity.Error, 'never', ['feat', 'fix']]);
          expect(rule).to.be.instanceOf(EnumRule);
        });
      });

      describe('full-stop', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'full-stop', [RuleConfigSeverity.Error, 'always', '.']);
          expect(rule).to.be.instanceOf(FullStopRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'full-stop', [RuleConfigSeverity.Error, 'never', '.']);
          expect(rule).to.be.instanceOf(FullStopRule);
        });
      });

      describe('max-length', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'max-length', [RuleConfigSeverity.Error, 'always', 100]);
          expect(rule).to.be.instanceOf(MaxLengthRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'max-length', [RuleConfigSeverity.Error, 'never', 100]);
          expect(rule).to.be.instanceOf(MaxLengthRule);
        });
      });

      describe('max-line-length', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'max-line-length', [RuleConfigSeverity.Error, 'always', 100]);
          expect(rule).to.be.instanceOf(MaxLineLengthRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'max-line-length', [RuleConfigSeverity.Error, 'never', 100]);
          expect(rule).to.be.instanceOf(MaxLineLengthRule);
        });
      });

      describe('min-length', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'min-length', [RuleConfigSeverity.Error, 'always', 10]);
          expect(rule).to.be.instanceOf(MinLengthRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'min-length', [RuleConfigSeverity.Error, 'never', 10]);
          expect(rule).to.be.instanceOf(MinLengthRule);
        });
      });
    });

    describe('Rules without Values', () => {
      describe('empty', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'empty', [RuleConfigSeverity.Error, 'always']);
          expect(rule).to.be.instanceOf(EmptyRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'empty', [RuleConfigSeverity.Error, 'never']);
          expect(rule).to.be.instanceOf(EmptyRule);
        });
      });

      describe('exclamation-mark', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'exclamation-mark', [RuleConfigSeverity.Error, 'always']);
          expect(rule).to.be.instanceOf(ExclamationMarkRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'exclamation-mark', [RuleConfigSeverity.Error, 'never']);
          expect(rule).to.be.instanceOf(ExclamationMarkRule);
        });
      });

      describe('leading-blank', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'leading-blank', [RuleConfigSeverity.Error, 'always']);
          expect(rule).to.be.instanceOf(LeadingBlankRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'leading-blank', [RuleConfigSeverity.Error, 'never']);
          expect(rule).to.be.instanceOf(LeadingBlankRule);
        });
      });

      describe('trim', () => {
        it('should create a rule instance based on the rule name - always', () => {
          const rule = RulesEngine.createRule('subject', 'trim', [RuleConfigSeverity.Error, 'always']);
          expect(rule).to.be.instanceOf(TrimRule);
        });

        it('should create a rule instance based on the rule name - never', () => {
          const rule = RulesEngine.createRule('subject', 'trim', [RuleConfigSeverity.Error, 'never']);
          expect(rule).to.be.instanceOf(TrimRule);
        });
      });
    });
  });
});
