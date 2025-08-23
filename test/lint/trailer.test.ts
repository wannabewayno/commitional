import { createRuleTestSuite, type TestCase } from './index.js';

function commitWithFooter(...trailers: string[]) {
  return `feat: Authentication controller\n\n${trailers.map((trailer, idx) => `${trailer}: footer value - ${idx}`).join('\n\n')}`;
}

const VALID_CASES: TestCase[] = [
  { ruleType: 'empty', condition: 'always', input: commitWithFooter('') },
  { ruleType: 'empty', condition: 'never', input: commitWithFooter('Closes') },

  { ruleType: 'trim', condition: 'always', input: commitWithFooter('Closes') },
  { ruleType: 'trim', condition: 'never', input: commitWithFooter(' Closes ') },

  { ruleType: 'full-stop', condition: 'always', value: '!', input: commitWithFooter('Closes!') },
  { ruleType: 'full-stop', condition: 'never', value: '!', input: commitWithFooter('Closes') },

  { ruleType: 'max-length', condition: 'always', value: 20, input: commitWithFooter('Closes') },
  { ruleType: 'max-length', condition: 'never', value: 5, input: commitWithFooter('Very-Long-Trailer-Name') },

  { ruleType: 'min-length', condition: 'always', value: 3, input: commitWithFooter('Closes') },
  { ruleType: 'min-length', condition: 'never', value: 10, input: commitWithFooter('Fix') },

  { ruleType: 'full-stop', condition: 'always', input: commitWithFooter('Closes.') },
  { ruleType: 'full-stop', condition: 'never', input: commitWithFooter('Closes') },

  { ruleType: 'exists', condition: 'always', input: commitWithFooter('Closes') },
  { ruleType: 'exists', condition: 'never', input: commitWithFooter('') },

  { ruleType: 'case', condition: 'always', value: 'pascal-case', input: commitWithFooter('Closes') },
  { ruleType: 'case', condition: 'never', value: 'pascal-case', input: commitWithFooter('closes') },

  { ruleType: 'enum', condition: 'always', value: ['Closes', 'Fixes'], input: commitWithFooter('Closes') },
  { ruleType: 'enum', condition: 'never', value: ['Resolves'], input: commitWithFooter('Closes') },
];

const INVALID_CASES: TestCase[] = [
  {
    ruleType: 'empty',
    condition: 'always',
    input: commitWithFooter('Closes'),
    expectedFix: 'feat: Authentication controller',
  },
  // This one is a hard one to validate, without a word character before the colon, this won't be recognized as a footer.
  // Hence there will be no trailer rules to run validation on.
  { ruleType: 'empty', condition: 'never', input: commitWithFooter(''), skip: true },

  { ruleType: 'trim', condition: 'always', input: commitWithFooter(' Closes '), expectedFix: commitWithFooter('Closes') },
  { ruleType: 'trim', condition: 'never', input: commitWithFooter('Closes') },
  // exclamation-mark - always - traditionaly only handles exclamation mark before a colon 'feat!: breaking change'
  // for control over something ends with a partocualr character or not. use the 'full-stop' rule.
  {
    ruleType: 'full-stop',
    condition: 'always',
    value: '!',
    input: commitWithFooter('Closes'),
    expectedFix: commitWithFooter('Closes!'),
  },
  {
    ruleType: 'full-stop',
    condition: 'never',
    value: '!',
    input: commitWithFooter('Closes!'),
    expectedFix: commitWithFooter('Closes'),
  },

  {
    ruleType: 'max-length',
    condition: 'always',
    value: 5,
    input: commitWithFooter('Very-Long-Trailer-Name'),
    expectedFix: commitWithFooter('Very-'),
  },
  // No expected fix for never conditions
  { ruleType: 'max-length', condition: 'never', value: 20, input: commitWithFooter('Fix') },

  // No expected fix for min-length conditions
  { ruleType: 'min-length', condition: 'always', value: 10, input: commitWithFooter('Fix') },
  { ruleType: 'min-length', condition: 'never', value: 3, input: commitWithFooter('Very-Long-Trailer-Name') },

  {
    ruleType: 'full-stop',
    condition: 'always',
    value: '.',
    input: commitWithFooter('Closes'),
    expectedFix: commitWithFooter('Closes.'),
  },
  {
    ruleType: 'full-stop',
    condition: 'never',
    value: '.',
    input: commitWithFooter('Closes.'),
    expectedFix: commitWithFooter('Closes'),
  },

  {
    ruleType: 'exists',
    condition: 'always',
    value: 'Signed-off-by',
    input: commitWithFooter('Closes', 'Reviewed-by'),
    expectedFix: `${commitWithFooter('Closes', 'Reviewed-by')}\n\nSigned-off-by: `,
  },
  {
    ruleType: 'exists',
    condition: 'never',
    value: 'Closes',
    input: commitWithFooter('Closes'),
    expectedFix: 'feat: Authentication controller',
  },

  // Enum rules don't have expected fixes
  { ruleType: 'enum', condition: 'always', value: ['Closes', 'Fixes'], input: commitWithFooter('Resolves') },
  { ruleType: 'enum', condition: 'never', value: ['Closes', 'Fixes'], input: commitWithFooter('Closes') },

  { ruleType: 'case', condition: 'never', value: 'pascal-case', input: commitWithFooter('Closes') },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'sentence-case',
    input: commitWithFooter('signed off by'),
    expectedFix: commitWithFooter('Signed off by'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'start-case',
    input: commitWithFooter('signed off by'),
    expectedFix: commitWithFooter('Signed Off By'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'lower-case',
    input: commitWithFooter('Signed-Off-By'),
    expectedFix: commitWithFooter('signed-off-by'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'upper-case',
    input: commitWithFooter('signed off by'),
    expectedFix: commitWithFooter('SIGNED OFF BY'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'pascal-case',
    input: commitWithFooter('signed off by'),
    expectedFix: commitWithFooter('SignedOffBy'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'camel-case',
    input: commitWithFooter('signed off by'),
    expectedFix: commitWithFooter('signedOffBy'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'kebab-case',
    input: commitWithFooter('signed off by'),
    expectedFix: commitWithFooter('signed-off-by'),
  },
  {
    ruleType: 'case',
    condition: 'always',
    value: 'snake-case',
    input: commitWithFooter('signed off by'),
    expectedFix: commitWithFooter('signed_off_by'),
  },
];

createRuleTestSuite({
  scope: 'trailer',
  validCases: VALID_CASES,
  invalidCases: INVALID_CASES,
});
