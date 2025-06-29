import type RulesEngine from '../RulesEngine/index.js';

import ScopePrompt from './ScopePrompt.js';
import TypePrompt from './TypePrompt.js';
import SubjectPrompt from './SubjectPrompt.js';
import BodyPrompt from './BodyPrompt.js';
import { oraPromise } from 'ora';
import type { CommitPart } from '../RulesEngine/index.js';
import CommitMessage from '../CommitMessage/index.js';
import { green } from 'yoctocolors';
import type Diff from '../services/Git/Diff.js';
import Highlighter from '../lib/highlighter.js';
import FooterPrompt from './FooterPrompt.js';

const highlighter = Highlighter(
  value => green(value),
  () => '',
);

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
export function CommitPartFactory(rules: RulesEngine, diff: Diff, auto = false) {
  const { required } = rules.allowedCommitProps();
  const requiredProps = required.map(name => [name, `<${name}>`]) as [CommitPart, string][];

  /**
   * Renders a preview of the commit message with the current part highlighted
   * @param emphasis - The part to emphasize in the preview
   * @param value - The value to show for the emphasized part
   * @returns Formatted commit message text
   */
  function renderText(commit: CommitMessage, toHighlight: CommitPart, filter?: string) {
    // Make a copy of the commit in JSON
    const commitJSON = commit.toJSON();
    requiredProps.forEach(([key, value]) => {
      if (commitJSON[key]) return;
      if (key === 'footer') commitJSON[key] = [value];
      else commitJSON[key] = value;
    });

    // either we have a string, or we an array of strings... how about we have an optional selector for the array item we want to highlight.
    const itemToHighlight = commitJSON[toHighlight];

    if (Array.isArray(itemToHighlight)) {
      const highlightIndex = itemToHighlight.findIndex(v => v.startsWith(filter ?? ''));
      itemToHighlight.splice(highlightIndex, 1, highlighter(itemToHighlight[highlightIndex], toHighlight));
    } else {
      (commitJSON[toHighlight] as string) = highlighter(itemToHighlight, toHighlight);
    }

    // Format the commit message with all parts
    return CommitMessage.fromJSON(commitJSON).toString();
  }

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

    // Either auto-generate the value or use the provided value
    return auto
      ? await oraPromise(prompt.generate(diff, commit), {
          // Show loading spinner with preview text while generating
          text: `Generating ${renderText(commit, commitPart)}`,
          // Text to show on the command line history when generation completes
          successText: () => renderText(commit, commitPart),
        })
      : prompt.promptIfInvalid().then(value => {
          if (commitPart === 'footer') {
            // commit[commitPart] = value;
            const [token = '', message] = value.split(':');
            commit.footer(token, message);
          } else {
            commit[commitPart] = value;
          }
        }); // Present the prompt to the user with the initial value
  };
}
