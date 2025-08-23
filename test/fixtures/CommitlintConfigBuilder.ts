import type TestGitRepo from './TestGitRepo.js';
import { stringify } from 'yaml';

export type RuleLevel = 0 | 1 | 2;
export type RuleCondition = 'always' | 'never';
export type RuleConfig = [RuleLevel, RuleCondition, ...unknown[]];

export default class CommitlintConfigBuilder {
  private rules: Record<string, RuleConfig> = {};

  constructor(private repo: TestGitRepo) {}

  // Rule builder methods
  typeEnum(types: string[], condition: RuleCondition = 'always', level: RuleLevel = 2): this {
    this.rules['type-enum'] = [level, condition, types];
    return this;
  }

  typeEmpty(condition: RuleCondition = 'never', level: RuleLevel = 2): this {
    this.rules['type-empty'] = [level, condition];
    return this;
  }

  subjectEmpty(condition: RuleCondition = 'never', level: RuleLevel = 2): this {
    this.rules['subject-empty'] = [level, condition];
    return this;
  }

  subjectMaxLength(length: number, condition: RuleCondition = 'always', level: RuleLevel = 2): this {
    this.rules['subject-max-length'] = [level, condition, length];
    return this;
  }

  subjectMinLength(length: number, condition: RuleCondition = 'always', level: RuleLevel = 2): this {
    this.rules['subject-min-length'] = [level, condition, length];
    return this;
  }

  subjectCase(caseType: string, condition: RuleCondition = 'always', level: RuleLevel = 2): this {
    this.rules['subject-case'] = [level, condition, caseType];
    return this;
  }

  subjectFullStop(condition: RuleCondition = 'never', level: RuleLevel = 2, char = '.'): this {
    this.rules['subject-full-stop'] = [level, condition, char];
    return this;
  }

  bodyMaxLineLength(length: number, condition: RuleCondition = 'always', level: RuleLevel = 2): this {
    this.rules['body-max-line-length'] = [level, condition, length];
    return this;
  }

  scopeEnum(scopes: string[], condition: RuleCondition = 'always', level: RuleLevel = 2): this {
    this.rules['scope-enum'] = [level, condition, scopes];
    return this;
  }

  scopeEmpty(condition: RuleCondition = 'never', level: RuleLevel = 2): this {
    this.rules['scope-empty'] = [level, condition];
    return this;
  }

  footerCase(types: string[], condition: RuleCondition = 'never', level: RuleLevel = 2): this {
    this.rules['footer-case'] = [level, condition, types];
    return this;
  }

  // Custom rule method
  addRule(name: string, config: RuleConfig): this {
    this.rules[name] = config;
    return this;
  }

  // Preset configurations
  conventional(): this {
    return this.typeEnum(['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'])
      .typeEmpty()
      .subjectEmpty()
      .subjectMaxLength(50)
      .subjectCase('sentence-case')
      .subjectFullStop()
      .bodyMaxLineLength(72);
  }

  simple(): this {
    return this.typeEnum(['feat', 'fix', 'docs', 'chore']).typeEmpty().subjectEmpty().subjectMaxLength(50);
  }

  strict(): this {
    return this.conventional().subjectMinLength(5).scopeEmpty();
  }

  // Commit methods
  commitAsJs(filename = 'commitlint.config.js'): string {
    const config = { rules: this.rules };
    const content = `module.exports = ${JSON.stringify(config, null, 2)};`;
    this.repo.addFile(filename, content);
    return this.repo.commit(`ci: add ${filename}`, filename);
  }

  commitAsYaml(filename = '.commitlintrc.yaml'): string {
    const config = {
      rules: this.rules,
    };
    const content = stringify(config);
    this.repo.addFile(filename, content);
    return this.repo.commit(`ci: add ${filename}`, filename);
  }

  commitAsJson(filename = '.commitlintrc.json'): string {
    const config = {
      rules: this.rules,
    };
    const content = JSON.stringify(config, null, 2);
    this.repo.addFile(filename, content);
    return this.repo.commit(`ci: add ${filename}`, filename);
  }

  // Get config without committing
  getConfig(): { rules: Record<string, RuleConfig> } {
    return {
      rules: this.rules,
    };
  }

  writeJSON(filename = '.commitlintrc.json'): void {
    const config = {
      rules: this.rules,
    };
    const content = JSON.stringify(config, null, 2);
    this.repo.addFile(filename, content);
  }

  writeYAML(filename = '.commitlintrc.yaml'): void {
    const config = {
      rules: this.rules,
    };
    const content = stringify(config);
    this.repo.addFile(filename, content);
  }

  // Reset builder
  reset(): this {
    this.rules = {};
    return this;
  }
}
