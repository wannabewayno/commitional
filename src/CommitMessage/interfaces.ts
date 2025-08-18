import type { CommitPart } from "./index.js";

export interface ErrorsAndWarnings {
  type: CommitPart;
  filter?: string;
  errors: string[];
  warnings: string[];
}
