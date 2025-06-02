import load from '@commitlint/load';
import type { RuleConfigTuple } from '../rules/BaseRule.js';

export type QualifiedConfig = Awaited<ReturnType<typeof load>>;
export type CommitlintConfig = QualifiedConfig & {
  rules: { 'scope-allow-multiple'?: RuleConfigTuple<unknown> | (() => RuleConfigTuple<unknown>) };
};

const conventionalCommitTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore'];

const defaultConfig: CommitlintConfig = {
  extends: [],
  formatter: '',
  plugins: {},
  helpUrl: '', // TODO: will be the npm url once this is published
  prompt: {
    questions: {},
    messages: {},
    settings: {
      enableMultipleScopes: false,
      scopeEnumSeparator: ',',
    },
  },
  rules: {
    'scope-allow-multiple': [2, 'never', ','],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-min-length': [2, 'always', 3],
    'subject-max-length': [2, 'always', 72],
    'type-enum': [2, 'always', conventionalCommitTypes],
  },
};

export default async function loadConfig() {
  const commitlintConfig = await load().catch(() => defaultConfig);

  /*
    Commitlint doesn't have a rule for allowing multiple scopes.
    Instead it's controlled through prompt settings.
    Obstenively, it's always allowed and controlled through prompts

    We first take preference if the user has defined 'scope-allow-multiple'
    if not we try and read the prompt.settings. Assuming the commitlint defaults of 'false' with csv delimited if any.
  */
  if (!commitlintConfig.rules['scope-allow-multiple']) {
    const applicable = commitlintConfig.prompt.settings?.enableMultipleScopes ? 'always' : 'never';
    const delimiter = commitlintConfig.prompt.settings?.scopeEnumSeparator ?? ',';
    commitlintConfig.rules['scope-allow-multiple'] = [2, applicable, delimiter];
  }

  console.log(commitlintConfig);

  return commitlintConfig;
}
