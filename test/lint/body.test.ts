import { createRuleTestSuite, type TestCase } from './index.js';

function commitWithBody(body = '') {
  return body ? `feat: Authentication controller\n\n${body}` : 'feat: Authentication controller';
}

const VALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithBody('') },
  { ruleType: 'empty', condition: 'never', input: commitWithBody('Body content') },
  { ruleType: 'trim', condition: 'always', input: commitWithBody('Body content') },
  { ruleType: 'full-stop', condition: 'always', value: '!', input: commitWithBody('Body content!') },
  { ruleType: 'full-stop', condition: 'never', value: '!', input: commitWithBody('Body content') },
  { ruleType: 'max-length', condition: 'always', value: 50, input: commitWithBody('Body content') },
  { ruleType: 'max-length', condition: 'never', value: 5, input: commitWithBody('This is a very long body content') },
  { ruleType: 'min-length', condition: 'always', value: 5, input: commitWithBody('Body content') },
  { ruleType: 'min-length', condition: 'never', value: 20, input: commitWithBody('Short') },
  { ruleType: 'full-stop', condition: 'always', value: '.', input: commitWithBody('Body content.') },
  { ruleType: 'full-stop', condition: 'never', value: '.', input: commitWithBody('Body content') },
  { ruleType: 'exists', condition: 'always', input: commitWithBody('Body content') },
  { ruleType: 'exists', condition: 'never', input: commitWithBody('') },
  { ruleType: 'case', condition: 'always', value: 'sentence-case', input: commitWithBody('Body content here') },
  { ruleType: 'case', condition: 'never', value: 'sentence-case', input: commitWithBody('body content here') },
  { ruleType: 'max-line-length', condition: 'always', value: 50, input: commitWithBody('Short line\nAnother short line') },
];

const INVALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithBody('Body content'), expectedFix: commitWithBody('') },
  { ruleType: 'empty', condition: 'never', input: commitWithBody('') },
  {
    ruleType: 'trim',
    condition: 'always',
    input: commitWithBody(' Body content '),
    expectedFix: commitWithBody('Body content'),
    skip: true,
  },
  {
    ruleType: 'full-stop',
    condition: 'always',
    value: '!',
    input: commitWithBody('Body content'),
    expectedFix: commitWithBody('Body content!'),
  },
  {
    ruleType: 'full-stop',
    condition: 'never',
    value: '!',
    input: commitWithBody('Body content!'),
    expectedFix: commitWithBody('Body content'),
  },
  {
    ruleType: 'max-length',
    condition: 'always',
    value: 10,
    input: commitWithBody('This is a very long body content'),
    expectedFix: commitWithBody('This is a'),
  },
  { ruleType: 'max-length', condition: 'never', value: 50, input: commitWithBody('Short') },
  { ruleType: 'min-length', condition: 'always', value: 20, input: commitWithBody('Short') },
  { ruleType: 'min-length', condition: 'never', value: 5, input: commitWithBody('This is a very long body content') },
  {
    ruleType: 'full-stop',
    condition: 'always',
    value: '.',
    input: commitWithBody('Body content'),
    expectedFix: commitWithBody('Body content.'),
  },
  {
    ruleType: 'full-stop',
    condition: 'never',
    value: '.',
    input: commitWithBody('Body content.'),
    expectedFix: commitWithBody('Body content'),
  },
  {
    ruleType: 'exists',
    condition: 'always',
    value: 'Required content',
    input: commitWithBody('Other content'),
    expectedFix: commitWithBody('Other content'),
  },
  {
    ruleType: 'exists',
    condition: 'never',
    value: 'Body content',
    input: commitWithBody('Body content'),
    expectedFix: commitWithBody(''),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'sentence-case',
    input: commitWithBody('body content here'),
    expectedFix: commitWithBody('Body content here'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'lower-case',
    input: commitWithBody('Body Content Here'),
    expectedFix: commitWithBody('body content here'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'upper-case',
    input: commitWithBody('body content here'),
    expectedFix: commitWithBody('BODY CONTENT HERE'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'start-case',
    input: commitWithBody('body content here'),
    expectedFix: commitWithBody('Body Content Here'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'pascal-case',
    input: commitWithBody('body content here'),
    expectedFix: commitWithBody('BodyContentHere'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'camel-case',
    input: commitWithBody('body content here'),
    expectedFix: commitWithBody('bodyContentHere'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'kebab-case',
    input: commitWithBody('body content here'),
    expectedFix: commitWithBody('body-content-here'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'snake-case',
    input: commitWithBody('body content here'),
    expectedFix: commitWithBody('body_content_here'),
  },
  { ruleType: 'case', condition: 'never', value: 'sentence-case', input: commitWithBody('Body content here') },
  { ruleType: 'leading-blank', condition: 'always', input: commitWithBody('Body content') },
  {
    ruleType: 'max-line-length',
    condition: 'always',
    value: 10,
    input: commitWithBody('This is a very long line that exceeds the limit'),
  },
  { ruleType: 'max-line-length', condition: 'never', value: 50, input: commitWithBody('Short line'), skip: true },
];

createRuleTestSuite({
  scope: 'body',
  validCases: VALID_CASES,
  invalidCases: INVALID_CASES,
});
