import type RulesEngine from '../RulesEngine/index.js';

import ScopePrompt from './ScopePrompt.js';
import TypePrompt from './TypePrompt.js';
import SubjectPrompt from './SubjectPrompt.js';
import BodyPrompt from './BodyPrompt.js';
import { oraPromise } from 'ora';
import type { CommitPart } from '../RulesEngine/index.js';
import type CommitMessage from '../CommitMessage/index.js';
import { green } from 'yoctocolors';
import type Diff from '../services/Git/Diff.js';
import Highlighter from '../lib/highlighter.js';
import FooterPrompt from './FooterPrompt.js';

/**
 * Factory function that creates appropriate prompt instances based on commit part
 * @param rules - The rules engine containing validation rules
 * @returns A function that returns the appropriate prompt for a given commit part
 */
export function PromptFactory(rules: RulesEngine) {
  return (commitPart: CommitPart) => {
    // Return the appropriate prompt based on the commit part
    switch (commitPart) {
      case 'type':
        return new TypePrompt(rules);
      case 'scope':
        return new ScopePrompt(rules);
      case 'subject':
        return new SubjectPrompt(rules);
      case 'body':
        return new BodyPrompt(rules);
      case 'footer':
        return new FooterPrompt(rules);
      default:
        throw new Error(`Unknown commit part: ${commitPart}`);
    }
  };
}

/**
 * Factory function that creates a function to prompt for commit parts
 * @param rules - The rules engine containing validation rules
 * @param diff - The diff object containing staged changes
 * @param auto - Whether to automatically generate commit parts
 * @returns A function that prompts for a specific commit part
 */
export function CommitPartFactory(rules: RulesEngine, diff: Diff, commit: CommitMessage, auto = false) {
  const { required } = rules.allowedCommitProps();

  const requiredStyle = Highlighter(
    value => value,
    value => `<${value}>`,
  );
  const activeStyle = Highlighter(value => green(value));

  // set every required field with a style default.
  required.forEach(commitPart => commit.setStyle((value: string) => requiredStyle(value, commitPart), commitPart));

  // Style all components to set defaults on empty values
  commit.style();

  // Create a prompt factory to get the appropriate prompt for each part
  const promptFactory = PromptFactory(rules);

  /**
   * Function to prompt for a specific commit part
   * @param commitPart - The part of the commit to prompt for
   * @param partialCommit - Partial commit message with any already-provided parts
   * @returns Promise resolving to the value for the requested commit part
   */
  return async (commitPart: CommitPart, commit: CommitMessage) => {
    // Get the appropriate prompt for this commit part
    const prompt = promptFactory(commitPart);

    // Set active style
    commit.setStyle(
      (value: string) => activeStyle(value, required.includes(commitPart) ? `<${commitPart}>` : `[optional ${commitPart}]`),
      commitPart,
    );

    // Either auto-generate the value or use the provided value
    if (auto)
      await oraPromise(prompt.generate(diff, commit), {
        // Show loading spinner with preview text while generating
        text: `Generating ${commit.toString()}`,
        // Text to show on the command line history when generation completes
        successText: () => commit.toString(),
      });
    else await prompt.promptIfInvalid(commit); // Present the prompt to the user with the initial value

    commit.setStyle(value => value, commitPart);
  };
}
