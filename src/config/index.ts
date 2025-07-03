import load from '@commitlint/load';
import type { RuleConfigTuple } from '../RulesEngine/rules/BaseRule.js';

export type QualifiedConfig = Awaited<ReturnType<typeof load>>;
export type CommitlintConfig = QualifiedConfig & {
  rules: { 'scope-allow-multiple'?: RuleConfigTuple<unknown> | (() => RuleConfigTuple<unknown>) };
};

const conventionalCommitTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore'];
// const COMMIT_TYPES = [
//   { name: 'feat: A new feature', value: 'feat' },
//   { name: 'fix: A bug fix', value: 'fix' },
//   { name: 'docs: Documentation only changes', value: 'docs' },
//   { name: 'style: Changes that do not affect the meaning of the code', value: 'style' },
//   { name: 'refactor: A code change that neither fixes a bug nor adds a feature', value: 'refactor' },
//   { name: 'perf: A code change that improves performance', value: 'perf' },
//   { name: 'test: Adding missing tests or correcting existing tests', value: 'test' },
//   { name: 'build: Changes that affect the build system or external dependencies', value: 'build' },
//   { name: 'ci: Changes to our CI configuration files and scripts', value: 'ci' },
//   { name: "chore: Other changes that don't modify src or test files", value: 'chore' },
// ];

const defaultConfig: CommitlintConfig = {
  extends: [],
  formatter: '',
  plugins: {},
  helpUrl: '',
  prompt: {
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
    'subject-min-length': [2, 'always', 5],
    'subject-max-length': [2, 'always', 60],
    'body-max-line-length': [2, 'always', 72],
    'type-enum': [2, 'always', conventionalCommitTypes],
    'type-empty': [2, 'never'],
  },
};

export default async function loadConfig() {
  const commitlintConfig = await load().catch(() => defaultConfig);

  if (!Object.keys(commitlintConfig.rules).length) commitlintConfig.rules = defaultConfig.rules;

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

  return commitlintConfig as CommitlintConfig;
}
