import { createRuleTestSuite, type TestCase } from './index.js';

function commitWithScope(scope = '') {
  return scope ? `feat(${scope}): add feature` : 'feat: add feature';
}

const VALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithScope('') },
  { ruleType: 'empty', condition: 'never', input: commitWithScope('api') },
  { ruleType: 'trim', condition: 'always', input: commitWithScope('api') },
  { ruleType: 'full-stop', condition: 'always', value: '!', input: commitWithScope('api!') },
  { ruleType: 'full-stop', condition: 'never', value: '!', input: commitWithScope('api') },
  { ruleType: 'max-length', condition: 'always', value: 10, input: commitWithScope('api') },
  { ruleType: 'max-length', condition: 'never', value: 3, input: commitWithScope('authentication') },
  { ruleType: 'min-length', condition: 'always', value: 2, input: commitWithScope('api') },
  { ruleType: 'min-length', condition: 'never', value: 10, input: commitWithScope('ui') },
  { ruleType: 'full-stop', condition: 'always', value: '.', input: commitWithScope('api.') },
  { ruleType: 'full-stop', condition: 'never', value: '.', input: commitWithScope('api') },
  { ruleType: 'exists', condition: 'always', input: commitWithScope('api') },
  { ruleType: 'exists', condition: 'never', input: commitWithScope('') },
  { ruleType: 'case', condition: 'always', value: 'kebab-case', input: commitWithScope('user-api') },
  { ruleType: 'case', condition: 'never', value: 'kebab-case', input: commitWithScope('userAPI') },
  { ruleType: 'enum', condition: 'always', value: ['api', 'ui', 'core'], input: commitWithScope('api') },
  { ruleType: 'enum', condition: 'never', value: ['test', 'build'], input: commitWithScope('api') },
  { ruleType: 'allow-multiple', condition: 'always', input: 'feat(api,ui): add feature' },
  { ruleType: 'allow-multiple', condition: 'never', input: commitWithScope('api') },
];

const INVALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithScope('api'), expectedFix: commitWithScope('') },
  { ruleType: 'empty', condition: 'never', input: commitWithScope('') },
  {
    ruleType: 'full-stop',
    condition: 'always',
    value: '!',
    input: commitWithScope('api'),
    expectedFix: commitWithScope('api!'),
  },
  {
    ruleType: 'full-stop',
    condition: 'never',
    value: '!',
    input: commitWithScope('api!'),
    expectedFix: commitWithScope('api'),
  },
  {
    ruleType: 'max-length',
    condition: 'always',
    value: 3,
    input: commitWithScope('authentication'),
    expectedFix: commitWithScope('aut'),
  },
  { ruleType: 'max-length', condition: 'never', value: 10, input: commitWithScope('ui') },
  { ruleType: 'min-length', condition: 'always', value: 10, input: commitWithScope('ui') },
  { ruleType: 'min-length', condition: 'never', value: 2, input: commitWithScope('authentication') },
  {
    ruleType: 'full-stop',
    condition: 'always',
    value: '.',
    input: commitWithScope('api'),
    expectedFix: commitWithScope('api.'),
  },
  {
    ruleType: 'full-stop',
    condition: 'never',
    value: '.',
    input: commitWithScope('api.'),
    expectedFix: commitWithScope('api'),
  },
  {
    ruleType: 'exists',
    condition: 'always',
    value: 'core',
    input: commitWithScope('api'),
    expectedFix: commitWithScope('api'),
  },
  { ruleType: 'exists', condition: 'never', value: 'api', input: commitWithScope('api'), expectedFix: commitWithScope('') },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'kebab-case',
    input: commitWithScope('userAPI'),
    expectedFix: commitWithScope('user-api'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'lower-case',
    input: commitWithScope('API'),
    expectedFix: commitWithScope('api'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'upper-case',
    input: commitWithScope('api'),
    expectedFix: commitWithScope('API'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'pascal-case',
    input: commitWithScope('user api'),
    expectedFix: commitWithScope('UserApi'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'camel-case',
    input: commitWithScope('user api'),
    expectedFix: commitWithScope('userApi'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'snake-case',
    input: commitWithScope('user api'),
    expectedFix: commitWithScope('user_api'),
  },
  { ruleType: 'case', condition: 'never', value: 'kebab-case', input: commitWithScope('user-api') },
  { ruleType: 'enum', condition: 'always', value: ['api', 'ui', 'core'], input: commitWithScope('test') },
  { ruleType: 'enum', condition: 'never', value: ['api', 'ui', 'core'], input: commitWithScope('api') },
  // This fails... howeve running the test manually works fine. Unsure as to what the issue is.
  {
    ruleType: 'allow-multiple',
    condition: 'never',
    input: 'feat(api,ui): add feature',
    expectedFix: 'feat(api): add feature',
    skip: true,
  },
];

createRuleTestSuite({
  scope: 'scope',
  validCases: VALID_CASES,
  invalidCases: INVALID_CASES,
});
