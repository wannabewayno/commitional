import { createRuleTestSuite, type TestCase } from './index.js';

function commitWithFooter(...footers: string[]) {
  return `feat: Authentication controller\n\n${footers.join('\n\n')}`;
}

const VALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithFooter() },
  { ruleType: 'empty', condition: 'never', input: commitWithFooter('Closes: #123') },

  { ruleType: 'trim', condition: 'always', input: commitWithFooter('Closes: #123') },
  { ruleType: 'trim', condition: 'never', input: commitWithFooter(' Closes: #123 ') },

  { ruleType: 'full-stop', condition: 'always', value: '!', input: commitWithFooter('Closes: #123!') },
  { ruleType: 'exclamation-mark', condition: 'never', value: '!', input: commitWithFooter('Closes: #123') },
  { ruleType: 'exclamation-mark', condition: 'never', input: commitWithFooter('Closes: #123') },

  { ruleType: 'max-length', condition: 'always', value: 50, input: commitWithFooter('Closes: #123') },
  { ruleType: 'max-length', condition: 'never', value: 5, input: commitWithFooter('Very long footer content') },

  { ruleType: 'min-length', condition: 'always', value: 5, input: commitWithFooter('Closes: #123') },
  { ruleType: 'min-length', condition: 'never', value: 20, input: commitWithFooter('Fix') },

  { ruleType: 'full-stop', condition: 'always', input: commitWithFooter('Closes: #123.') },
  { ruleType: 'full-stop', condition: 'never', input: commitWithFooter('Closes: #123') },

  { ruleType: 'exists', condition: 'always', input: commitWithFooter('Closes: #123') },
  { ruleType: 'exists', condition: 'never', input: commitWithFooter('') },

  { ruleType: 'case', condition: 'always', value: 'lower-case', input: commitWithFooter('closes: #123') },
  { ruleType: 'case', condition: 'never', value: 'lower-case', input: commitWithFooter('Closes: #123') },

  { ruleType: 'max-line-length', condition: 'always', value: 50, input: commitWithFooter('Closes: #123\nFixes: #456') },
  {
    ruleType: 'max-line-length',
    condition: 'never',
    value: 10,
    input: commitWithFooter('Very long footer content that exceeds limit\nAnother long line'),
  },
];

const INVALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithFooter('Closes: #123') },
  { ruleType: 'empty', condition: 'never', input: commitWithFooter('') },

  {
    ruleType: 'trim',
    condition: 'always',
    input: commitWithFooter(' Closes: #123 '),
    expectedFix: commitWithFooter('Closes: #123'),
  },
  { ruleType: 'trim', condition: 'never', input: commitWithFooter('Closes: #123') },

  // exclamation-mark - always - traditionaly only handles exclamation mark before a colon 'feat!: breaking change'
  // for control over something ends with a partocualr character or not. use the 'full-stop' rule.
  { ruleType: 'exclamation-mark', condition: 'always', input: commitWithFooter('Closes: #123') },
  { ruleType: 'exclamation-mark', condition: 'never', input: commitWithFooter('Closes!: #123') },

  {
    ruleType: 'max-length',
    condition: 'always',
    value: 10,
    input: commitWithFooter('Signed-off-by: Very long footer content'),
  },
  { ruleType: 'max-length', condition: 'never', value: 50, input: commitWithFooter('Fixes: #123') },

  { ruleType: 'min-length', condition: 'always', value: 20, input: commitWithFooter('Fixes: things') },
  {
    ruleType: 'min-length',
    condition: 'never',
    value: 5,
    input: commitWithFooter('Unsure: what a never min-length rule should behave?'),
    skip: true,
  },

  {
    ruleType: 'full-stop',
    condition: 'always',
    value: '.',
    input: commitWithFooter('Closes: #123'),
    expectedFix: commitWithFooter('Closes: #123.'),
  },
  {
    ruleType: 'full-stop',
    condition: 'never',
    value: '.',
    input: commitWithFooter('Closes: #123.'),
    expectedFix: commitWithFooter('Closes: #123'),
  },

  {
    ruleType: 'exists',
    condition: 'always',
    value: 'QC: Pass',
    input: commitWithFooter('Closes: #123', 'Tests: Passing'),
    expectedFix: commitWithFooter('Closes: #123', 'Tests: Passing', 'QC: Pass'),
  },
  {
    ruleType: 'exists',
    condition: 'never',
    value: 'Signed-off-by: Simon',
    input: commitWithFooter('Closes: #123', 'Signed-off-by: Simon'),
    expectedFix: commitWithFooter('Closes: #123'),
  },

  {
    ruleType: 'case',
    condition: 'always',
    value: 'lower-case',
    input: commitWithFooter('Closes: #123'),
    expectedFix: commitWithFooter('closes: #123'),
  },
  {
    ruleType: 'case',
    condition: 'never',
    value: 'lower-case',
    input: commitWithFooter('closes: #123'),
    expectedFix: commitWithFooter('CLOSES: #123'),
  },

  {
    ruleType: 'max-line-length',
    condition: 'always',
    value: 20,
    input: commitWithFooter('BREAKING CHANGE: Very long footer content that exceeds limit'),
  },
  {
    ruleType: 'max-line-length',
    condition: 'never',
    value: 50,
    input: commitWithFooter('BREAKING CHANGE: Unsure what the behaviour for never max-line-length should be'),
    skip: true,
  },
];

createRuleTestSuite({
  scope: 'footers',
  validCases: VALID_CASES,
  invalidCases: INVALID_CASES,
});
