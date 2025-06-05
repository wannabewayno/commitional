export { default as ScopePrompt } from './ScopePrompt.js';
export { default as TypePrompt } from './TypePrompt.js';
export { default as TitlePrompt } from './TitlePrompt.js';
export { default as BodyPrompt } from './BodyPrompt.js';
export interface CommitMessage {
  type: string;
  title: string;
  scope?: string[] | string;
  body: string;
  breaking: boolean;
}
