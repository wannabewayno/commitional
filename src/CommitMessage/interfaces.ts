import type { CommitPart } from '../RulesEngine/index.js';

export interface ErrorsAndWarnings {
  type: CommitPart;
  filter?: string;
  errors: string[];
  warnings: string[];
}
