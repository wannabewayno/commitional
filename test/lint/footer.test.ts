import { createRuleTestSuite, type TestCase } from './index.js';

function commitWithFooter(footer = '') {
  return footer ? `feat: Authentication controller\n\nCloses: ${footer}` : 'feat: Authentication controller';
}

const VALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithFooter('') },
  { ruleType: 'empty', condition: 'never', input: commitWithFooter('#123') },

  { ruleType: 'trim', condition: 'always', input: commitWithFooter('#123') },

  { ruleType: 'full-stop', condition: 'always', value: '!', input: commitWithFooter('#123!') },
  { ruleType: 'full-stop', condition: 'never', value: '!', input: commitWithFooter('#123') },

  { ruleType: 'max-length', condition: 'always', value: 50, input: commitWithFooter('#123') },
  { ruleType: 'max-length', condition: 'never', value: 3, input: commitWithFooter('Very long footer value content') },

  { ruleType: 'min-length', condition: 'always', value: 3, input: commitWithFooter('#123') },
  { ruleType: 'min-length', condition: 'never', value: 10, input: commitWithFooter('Fix') },

  { ruleType: 'full-stop', condition: 'always', input: commitWithFooter('#123.') },
  { ruleType: 'full-stop', condition: 'never', input: commitWithFooter('#123') },

  { ruleType: 'exists', condition: 'always', input: commitWithFooter('#123') },
  { ruleType: 'exists', condition: 'never', input: commitWithFooter('') },

  { ruleType: 'case', condition: 'always', value: 'lower-case', input: commitWithFooter('issue description') },
  { ruleType: 'case', condition: 'never', value: 'lower-case', input: commitWithFooter('Issue Description') },
];

const INVALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithFooter('#123'), expectedFix: commitWithFooter('') },
  { ruleType: 'empty', condition: 'never', input: commitWithFooter('') },

  { ruleType: 'trim', condition: 'always', input: commitWithFooter(' #123 '), expectedFix: commitWithFooter('#123') },

  {
    ruleType: 'full-stop',
    condition: 'always',
    value: '!',
    input: commitWithFooter('#123'),
    expectedFix: commitWithFooter('#123!'),
  },
  {
    ruleType: 'full-stop',
    condition: 'never',
    value: '!',
    input: commitWithFooter('#123!'),
    expectedFix: commitWithFooter('#123'),
  },

  {
    ruleType: 'max-length',
    condition: 'always',
    value: 3,
    input: commitWithFooter('Very long footer value content'),
    expectedFix: commitWithFooter('Ver'),
  },
  { ruleType: 'max-length', condition: 'never', value: 50, input: commitWithFooter('Fix') },

  { ruleType: 'min-length', condition: 'always', value: 10, input: commitWithFooter('Fix') },
  { ruleType: 'min-length', condition: 'never', value: 3, input: commitWithFooter('Very long footer value content') },

  {
    ruleType: 'full-stop',
    condition: 'always',
    value: '.',
    input: commitWithFooter('#123'),
    expectedFix: commitWithFooter('#123.'),
  },
  {
    ruleType: 'full-stop',
    condition: 'never',
    value: '.',
    input: commitWithFooter('#123.'),
    expectedFix: commitWithFooter('#123'),
  },

  {
    ruleType: 'exists',
    condition: 'always',
    value: 'Pass',
    input: commitWithFooter('#123'),
    expectedFix: `${commitWithFooter('#123')}\n\n: Pass`,
  },
  {
    ruleType: 'exists',
    condition: 'never',
    value: '#123',
    input: commitWithFooter('#123'),
    expectedFix: 'feat: Authentication controller',
  },

  {
    ruleType: 'case',
    condition: 'always',
    value: 'lower-case',
    input: commitWithFooter('Issue Description'),
    expectedFix: commitWithFooter('issue description'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'sentence-case',
    input: commitWithFooter('issue description'),
    expectedFix: commitWithFooter('Issue description'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'start-case',
    input: commitWithFooter('issue description'),
    expectedFix: commitWithFooter('Issue Description'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'upper-case',
    input: commitWithFooter('issue description'),
    expectedFix: commitWithFooter('ISSUE DESCRIPTION'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'pascal-case',
    input: commitWithFooter('issue description'),
    expectedFix: commitWithFooter('IssueDescription'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'camel-case',
    input: commitWithFooter('issue description'),
    expectedFix: commitWithFooter('issueDescription'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'kebab-case',
    input: commitWithFooter('issue description'),
    expectedFix: commitWithFooter('issue-description'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'snake-case',
    input: commitWithFooter('issue description'),
    expectedFix: commitWithFooter('issue_description'),
  },
  {
    ruleType: 'case',
    condition: 'never',
    value: 'lower-case',
    input: commitWithFooter('issue description'),
    expectedFix: commitWithFooter('ISSUE DESCRIPTION'),
  },
];

createRuleTestSuite({
  scope: 'footer',
  validCases: VALID_CASES,
  invalidCases: INVALID_CASES,
});
