import type load from '@commitlint/load';

type QualifiedConfig = Awaited<ReturnType<typeof load>>;

const conventionalCommitTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore'];

const defaultConfig: QualifiedConfig = {
  extends: [],
  formatter: '',
  plugins: {},
  helpUrl: '', // TODO: will be the npm url once this is published
  prompt: {
    questions: {},
    messages: {},
  },
  rules: {
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-min-length': [2, 'always', 3],
    'subject-max-length': [2, 'always', 72],
    'type-enum': [2, 'always', conventionalCommitTypes],
  },
};

export default defaultConfig;
