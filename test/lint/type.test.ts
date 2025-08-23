import { createRuleTestSuite, type TestCase } from './index.js';

function commitWithType(type = '') {
  return type ? `${type}: add feature` : 'add feature';
}

const VALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithType('') },
  { ruleType: 'empty', condition: 'never', input: commitWithType('feat') },
  { ruleType: 'trim', condition: 'always', input: commitWithType('feat') },
  { ruleType: 'full-stop', condition: 'always', value: '.', input: commitWithType('feat.') },
  { ruleType: 'full-stop', condition: 'never', value: '.', input: commitWithType('feat') },
  { ruleType: 'max-length', condition: 'always', value: 10, input: commitWithType('feat') },
  { ruleType: 'max-length', condition: 'never', value: 3, input: commitWithType('feature') },
  { ruleType: 'min-length', condition: 'always', value: 3, input: commitWithType('feat') },
  { ruleType: 'min-length', condition: 'never', value: 10, input: commitWithType('fix') },
  { ruleType: 'exists', condition: 'always', input: commitWithType('feat') },
  { ruleType: 'exists', condition: 'never', input: commitWithType('') },
  { ruleType: 'case', condition: 'always', value: 'lower-case', input: commitWithType('feat') },
  { ruleType: 'case', condition: 'never', value: 'lower-case', input: commitWithType('FEAT') },
  { ruleType: 'enum', condition: 'always', value: ['feat', 'fix', 'docs'], input: commitWithType('feat') },
  { ruleType: 'enum', condition: 'never', value: ['bug', 'chore'], input: commitWithType('feat') },
];

const INVALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithType('feat'), expectedFix: commitWithType('') },
  { ruleType: 'empty', condition: 'never', input: commitWithType('') },
  { ruleType: 'trim', condition: 'always', input: commitWithType(' feat '), expectedFix: commitWithType('feat') },
  {
    ruleType: 'full-stop',
    condition: 'always',
    value: '.',
    input: commitWithType('feat'),
    expectedFix: commitWithType('feat.'),
  },
  {
    ruleType: 'full-stop',
    condition: 'never',
    value: '.',
    input: commitWithType('feat.'),
    expectedFix: commitWithType('feat'),
  },
  {
    ruleType: 'max-length',
    condition: 'always',
    value: 3,
    input: commitWithType('feature'),
    expectedFix: commitWithType('fea'),
  },
  { ruleType: 'max-length', condition: 'never', value: 10, input: commitWithType('fix') },
  { ruleType: 'min-length', condition: 'always', value: 10, input: commitWithType('fix') },
  { ruleType: 'min-length', condition: 'never', value: 3, input: commitWithType('feature') },
  {
    ruleType: 'exists',
    condition: 'always',
    value: 'docs',
    input: commitWithType('feat'),
    expectedFix: commitWithType('feat'),
  },
  { ruleType: 'exists', condition: 'never', value: 'feat', input: commitWithType('feat'), expectedFix: commitWithType('') },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'lower-case',
    input: commitWithType('FEAT'),
    expectedFix: commitWithType('feat'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'upper-case',
    input: commitWithType('feat'),
    expectedFix: commitWithType('FEAT'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'pascal-case',
    input: commitWithType('feat type'),
    expectedFix: commitWithType('FeatType'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'camel-case',
    input: commitWithType('feat type'),
    expectedFix: commitWithType('featType'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'kebab-case',
    input: commitWithType('feat type'),
    expectedFix: commitWithType('feat-type'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'snake-case',
    input: commitWithType('feat type'),
    expectedFix: commitWithType('feat_type'),
  },
  {
    ruleType: 'case',
    condition: 'never',
    value: 'lower-case',
    input: commitWithType('feat'),
    expectedFix: commitWithType('FEAT'),
  },
  { ruleType: 'enum', condition: 'always', value: ['feat', 'fix', 'docs'], input: commitWithType('bug') },
  { ruleType: 'enum', condition: 'never', value: ['feat', 'fix', 'docs'], input: commitWithType('feat') },
];

createRuleTestSuite({
  scope: 'type',
  validCases: VALID_CASES,
  invalidCases: INVALID_CASES,
});
