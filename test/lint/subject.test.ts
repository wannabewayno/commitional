import { createRuleTestSuite, type TestCase } from './index.js';

const VALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: '', expectedFix: '' },
  { ruleType: 'empty', condition: 'never', input: 'Add feature' },
  { ruleType: 'trim', condition: 'always', input: 'Add feature' },
  { ruleType: 'trim', condition: 'never', input: ' Add feature ' },
  { ruleType: 'full-stop', condition: 'always', input: 'Add feature!', value: '!' },
  { ruleType: 'full-stop', condition: 'never', input: 'Add feature', value: '!' },
  { ruleType: 'max-length', condition: 'always', value: 50, input: 'Add feature' },
  { ruleType: 'max-length', condition: 'never', value: 5, input: 'Add comprehensive feature' },
  { ruleType: 'min-length', condition: 'always', value: 5, input: 'Add feature' },
  { ruleType: 'min-length', condition: 'never', value: 20, input: 'Fix' },
  { ruleType: 'full-stop', condition: 'always', input: 'Add feature.', value: '.' },
  { ruleType: 'full-stop', condition: 'never', input: 'Add feature', value: '.' },
  { ruleType: 'exists', condition: 'always', input: 'Add feature' },
  { ruleType: 'exists', condition: 'never', input: '' },
  { ruleType: 'case', condition: 'always', value: 'sentence-case', input: 'Add feature' },
  { ruleType: 'case', condition: 'never', value: 'sentence-case', input: 'add feature' },
];

const INVALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: 'Add feature', expectedFix: '' },
  { ruleType: 'empty', condition: 'never', input: '' },
  { ruleType: 'trim', condition: 'always', input: ' Add feature ', expectedFix: 'Add feature' },
  { ruleType: 'full-stop', condition: 'always', input: 'Add feature', value: '!', expectedFix: 'Add feature!' },
  { ruleType: 'full-stop', condition: 'never', input: 'Add feature!', value: '!', expectedFix: 'Add feature' },
  { ruleType: 'max-length', condition: 'always', value: 10, input: 'Add comprehensive feature', expectedFix: 'Add compre' },
  { ruleType: 'max-length', condition: 'never', value: 20, input: 'Fix' },
  { ruleType: 'min-length', condition: 'always', value: 5, input: 'Fix' },
  { ruleType: 'full-stop', condition: 'always', input: 'Add feature', value: '.', expectedFix: 'Add feature.' },
  { ruleType: 'full-stop', condition: 'never', input: 'Add feature.', value: '.', expectedFix: 'Add feature' },
  { ruleType: 'exists', condition: 'always', input: 'Fix Feature', value: 'Add feature', expectedFix: 'Fix Feature' },
  { ruleType: 'exists', condition: 'never', input: 'Add feature', value: 'Add feature', expectedFix: '' },
  { ruleType: 'case', condition: 'always', value: 'sentence-case', input: 'add feature', expectedFix: 'Add feature' },
  { ruleType: 'case', condition: 'always', value: 'start-case', input: 'add feature', expectedFix: 'Add Feature' },
  { ruleType: 'case', condition: 'always', value: 'lower-case', input: 'Add Feature', expectedFix: 'add feature' },
  { ruleType: 'case', condition: 'always', value: 'upper-case', input: 'add feature', expectedFix: 'ADD FEATURE' },
  { ruleType: 'case', condition: 'always', value: 'pascal-case', input: 'add feature', expectedFix: 'AddFeature' },
  { ruleType: 'case', condition: 'always', value: 'camel-case', input: 'add feature', expectedFix: 'addFeature' },
  { ruleType: 'case', condition: 'always', value: 'kebab-case', input: 'add feature', expectedFix: 'add-feature' },
  { ruleType: 'case', condition: 'always', value: 'snake-case', input: 'add feature', expectedFix: 'add_feature' },
  { ruleType: 'case', condition: 'never', value: 'sentence-case', input: 'Add feature', expectedFix: 'add feature' },
];

createRuleTestSuite({
  scope: 'subject',
  validCases: VALID_CASES,
  invalidCases: INVALID_CASES,
});
