import TestGitRepo from '../fixtures/TestGitRepo.js';
import CommitlintConfigBuilder, { type RuleConfig } from '../fixtures/CommitlintConfigBuilder.js';
import Cliete from 'cliete';
import { expect } from 'chai';
import path from 'node:path';

type RuleType =
  | 'case'
  | 'max-line-length'
  | 'empty'
  | 'enum'
  | 'leading-blank'
  | 'max-length'
  | 'min-length'
  | 'exclamation-mark'
  | 'allow-multiple'
  | 'exists'
  | 'full-stop'
  | 'trim';
type CaseType =
  | 'lower-case'
  | 'upper-case'
  | 'camel-case'
  | 'kebab-case'
  | 'pascal-case'
  | 'sentence-case'
  | 'snake-case'
  | 'start-case';
type RuleScope = 'scope' | 'type' | 'subject' | 'body' | 'footer' | 'trailer' | 'footers';

export interface TestCase {
  ruleType: RuleType;
  condition: 'always' | 'never';
  value?: string | string[] | number;
  input: string;
  expectedErrors?: string[];
  expectedFix?: string;
  focus?: boolean;
  skip?: boolean;
}

export interface TestSuiteConfig {
  scope: RuleScope;
  validCases: TestCase[];
  invalidCases: TestCase[];
  focus?: boolean;
}

function test({ focus, skip }: { focus?: boolean; skip?: boolean }) {
  if (focus) return it.only;
  if (skip) return it.skip;
  return it;
}

export function createRuleTestSuite(config: TestSuiteConfig) {
  const { invalidCases, validCases, focus, scope } = config;

  (focus ? describe.only : describe)(`${scope.charAt(0).toUpperCase() + scope.slice(1)} Rules E2E`, () => {
    let repo: TestGitRepo;
    let configBuilder: CommitlintConfigBuilder;
    const commitMsgFile = 'COMMIT_EDITMSG';
    let commitMsgPath: string;

    before(() => {
      repo = new TestGitRepo();
      configBuilder = new CommitlintConfigBuilder(repo);
      commitMsgPath = path.join(repo.tempDir, commitMsgFile);
      Cliete.setDefault('cwd', repo.tempDir);
      Cliete.setDefault('timeout', null);
    });

    after(() => {
      repo.teardown();
    });

    describe('Valid Cases', () => {
      afterEach(() => repo.removeFile(commitMsgFile));

      validCases.forEach(testCase => {
        const { ruleType, condition, value, focus, input, skip } = testCase;

        const rule = `${scope}-${ruleType}`;
        const testName = `${rule} ${condition}${value ? ` (${JSON.stringify(value)})` : ''}`;

        test({ skip, focus })(testName, async () => {
          const ruleConfig: RuleConfig = [2, condition, ...(value !== undefined ? [value] : [])];

          configBuilder.reset().addRule(rule, ruleConfig).writeYAML();
          repo.addFile(commitMsgFile, input);

          const I = await Cliete.openTerminal(`commitional lint ${commitMsgPath}`);
          await I.wait.for.the.process.to.exit.with.exit.code.zero;
        });
      });
    });

    describe('Invalid Cases', () => {
      afterEach(() => repo.removeFile(commitMsgFile));

      invalidCases.forEach(testCase => {
        const { ruleType, condition, value, focus, input, expectedErrors, skip } = testCase;

        const rule = `${scope}-${ruleType}`;
        const testName = `${rule} ${condition}${value ? ` (${JSON.stringify(value)})` : ''}`;

        test({ focus, skip })(testName, async () => {
          const ruleConfig: RuleConfig = [2, condition, ...(value !== undefined ? [value] : [])];

          configBuilder.reset().addRule(rule, ruleConfig).writeYAML();
          repo.addFile(commitMsgFile, input);

          const I = await Cliete.openTerminal(`commitional lint ${commitMsgPath}`);
          await I.wait.until.the.process.exits.with.nonZero.exit.code;

          if (expectedErrors) {
            for (const error of expectedErrors) {
              await I.wait.until.I.see(error);
            }
          }
        });
      });
    });

    describe('Fix Cases', () => {
      afterEach(() => repo.removeFile(commitMsgFile));

      invalidCases
        .concat(validCases)
        .filter(tc => tc.expectedFix !== undefined)
        .forEach(testCase => {
          const { ruleType, condition, value, focus, input, expectedFix, skip } = testCase;

          const rule = `${scope}-${ruleType}`;
          const testName = `${rule} ${condition}${value ? ` (${JSON.stringify(value)})` : ''} - fix`;

          test({ skip, focus })(testName, async () => {
            const ruleConfig: RuleConfig = [2, condition, ...(value !== undefined ? [value] : [])];

            configBuilder.reset().addRule(rule, ruleConfig).writeYAML();
            repo.addFile(commitMsgFile, input);

            const I = await Cliete.openTerminal(`commitional lint ${commitMsgPath} --fix`);
            await I.wait.for.the.process.to.exit.with.exit.code.zero;

            const fixedContent = repo.getFileContents(commitMsgFile);
            expect(fixedContent).to.equal(expectedFix);
          });
        });
    });
  });
}
