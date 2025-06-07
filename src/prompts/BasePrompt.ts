import type RulesEngine from '../rules/index.js';
import type { CommitPart } from '../rules/index.js';
import AIProvider from '../services/AI/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class BasePrompt {
  protected AI = AIProvider();
  protected rules: RulesEngine;

  constructor(rules: RulesEngine, type: CommitPart) {
    this.rules = rules.narrow(type);
  }

  protected commitStandard(): string {
    return fs.readFileSync(path.join(__dirname, 'commit-message-standard.md'), 'utf8');
  }
}
