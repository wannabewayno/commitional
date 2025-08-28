import { input } from '@inquirer/prompts';
import { red } from 'yoctocolors';
import type RulesEngine from '../RulesEngine/index.js';
import BasePrompt from './BasePrompt.js';
import { ScopeDeducer } from '../services/NamespaceResolver/index.js';
import type Diff from '../services/Git/Diff.js';
import type CommitMessage from '../CommitMessage/index.js';

export default class ScopePrompt extends BasePrompt {
  constructor(rules: RulesEngine) {
    super(rules, 'scope');
  }

  async generate(diff: Diff, commit: CommitMessage) {
    const scopeDeducer = ScopeDeducer.fromRulesEngine(this.rules);
    const scopes = scopeDeducer.deduceScope(diff.files) ?? [];

    // set the commit's scope
    commit.addScope(...scopes);
  }

  async prompt(commit: CommitMessage): Promise<void> {
    const scope = this.rules.omit('exists', 'allow-multiple');

    // TODO: Scope enums will need to be expanded to look at the file system in order to deduce allowed scopes (only if an enum is set)
    // const [enumRule] = scope.getRulesOfType('enum');

    const [validScope] = await input({
      message: 'Scope of commit:',
      default: commit.scope,
      prefill: 'editable',
      validate: value => {
        const [, errors] = scope.validate(value);
        if (errors.length) return errors.join('\n');
        return true;
      },
      transformer: value => {
        const [fixed, errors] = scope.validate(value);
        if (!fixed) return '';
        return errors.length ? red(fixed) : fixed;
      },
    }).then(answer => scope.validate(answer));

    commit.scope = validScope;
  }
}
