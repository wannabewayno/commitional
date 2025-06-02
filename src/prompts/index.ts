export { default as ScopePrompt } from './ScopePrompt.js';
export { default as TypePrompt } from './TypePrompt.js';
export { default as SubjectPrompt } from './SubjectPrompt.js';
export interface CommitMessage {
  type: string;
  title: string;
  scope?: string[] | string;
  body: string;
  breaking: boolean;
}
