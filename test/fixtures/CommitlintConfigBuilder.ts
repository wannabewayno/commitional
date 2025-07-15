import type TestGitRepo from './TestGitRepo.js';
import { stringify } from 'yaml';

type RuleLevel = 0 | 1 | 2;
type RuleCondition = 'always' | 'never';
type RuleConfig = [RuleLevel, RuleCondition, ...unknown[]];

export default class CommitlintConfigBuilder {
  private rules: Record<string, RuleConfig> = {};

  constructor(private repo: TestGitRepo) {}

  // Rule builder methods
  typeEnum(types: string[], level: RuleLevel = 2, condition: RuleCondition = 'always'): this {
    this.rules['type-enum'] = [level, condition, types];
    return this;
  }

  typeEmpty(level: RuleLevel = 2, condition: RuleCondition = 'never'): this {
    this.rules['type-empty'] = [level, condition];
    return this;
  }

  subjectEmpty(level: RuleLevel = 2, condition: RuleCondition = 'never'): this {
    this.rules['subject-empty'] = [level, condition];
    return this;
  }

  subjectMaxLength(length: number, level: RuleLevel = 2, condition: RuleCondition = 'always'): this {
    this.rules['subject-max-length'] = [level, condition, length];
    return this;
  }

  subjectMinLength(length: number, level: RuleLevel = 2, condition: RuleCondition = 'always'): this {
    this.rules['subject-min-length'] = [level, condition, length];
    return this;
  }

  subjectCase(caseType: string, level: RuleLevel = 2, condition: RuleCondition = 'always'): this {
    this.rules['subject-case'] = [level, condition, caseType];
    return this;
  }

  subjectFullStop(level: RuleLevel = 2, condition: RuleCondition = 'never', char = '.'): this {
    this.rules['subject-full-stop'] = [level, condition, char];
    return this;
  }

  bodyMaxLineLength(length: number, level: RuleLevel = 2, condition: RuleCondition = 'always'): this {
    this.rules['body-max-line-length'] = [level, condition, length];
    return this;
  }

  scopeEnum(scopes: string[], level: RuleLevel = 2, condition: RuleCondition = 'always'): this {
    this.rules['scope-enum'] = [level, condition, scopes];
    return this;
  }

  scopeEmpty(level: RuleLevel = 2, condition: RuleCondition = 'never'): this {
    this.rules['scope-empty'] = [level, condition];
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

  // Reset builder
  reset(): this {
    this.rules = {};
    return this;
  }
}
