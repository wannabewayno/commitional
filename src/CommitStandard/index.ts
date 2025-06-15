/**
 * Class for parsing, formatting and describing a given commit standard from a rules configuration
 */
export default class CommitStandard {
  // constructor()
}

// subject

// Lorem ipsum dolor sit amet, consectetur adipiscing elit.

// Trailers: Git Trailer Convention (essentially more footers) Must be at the end of trailers.
// Signed-off-by: Alice <alice@example.com>
// Signed-off-by: Bob <bob@example.com>

// https://git-scm.com/docs/git-interpret-trailers

// I need to show AI how to
// Conventional Commits
// <type>[optional scope]: <description>

// [optional body]

// [optional footer(s)]

// trailer is just a footer with a specific title

// Ref: https://www.conventionalcommits.org/en/v1.0.0/#summary

/**
 * Generate a good example of a commit message that adheres to the current rules.
 * It will be used a golden example for AI system messages.
 */
// private async commitGeneralRules(): Promise<string> {
//   // TODO: check if it's saved in a temp file and return early if so.

//   // We have an example already for a set of rules and it's associated commit message from GitHub's commit standard
//   // We will ask the user's preferred AI Service to generate a modified version of our example that adhered to the user's custom rules.
//   const ai = this.AI.byPreference();

//   const rules = this.rules.describe();

//   const goldenCommitForCurrentRules = await ai.completion()
//     .usecase('Coding')
//     .system(
//       'You are a helpful assistant that helps software engineers format their commit messages to comply with their organization\'s commit message guidelines',
//       'We currently require your help in calibrating the system.',
//       'You will be prompted with a set of organizational commit message guidelines and you will be required to re-format and edit the existing example commit to comply with the rules provided in the prompt.',
//       '',
//       'Here is an example set of rules:',
//       generalRules.rules,
//       '',
//       'Here is a perfect example of a commit message that adheres to the given rules:',
//       generalRules.examples[0] ?? '',
//       '',
//       'when prompted with a new set of rules, you must only take one of two actions:',
//       '1. Modify the commit message to comply with the guidelines if in breach.',
//       '2. Return the commit message unaltered',
//       '',
//       'Only respond with a modified version of the example commit message or the example commit message unmodified if it complies with the provided rules',
//       'DO NOT respond with any other surrounding text like pleasantries or explanations.',
//     )
//     .prompt(rules)
//     .text();

//     return [
//       rules,
//       '',
//       'Here is a perfect example of a commit message that adheres to the given rules:',
//       '',
//       goldenCommitForCurrentRules
//     ].join('\n');

//   /*
//     TODO: Save this to a temp directory so avoid excessive AI re-use
//     It only needs to be re-calculated when
//     1. rules change
//     2. temp file is cleared
//   */
// }

// Write a commit that has all the properties.
// Required an optional parts are included.
// Forbidden parts are not.

/*
    Examples:
    Commit message with description and breaking change footer
    feat: allow provided config object to extend other configs

  BREAKING CHANGE: `extends` key in config file is now used for extending other config files
  Commit message with ! to draw attention to breaking change
  feat: send an email to the customer when a product is shipped
  Commit message with scope and ! to draw attention to breaking change
  feat(api)!: send an email to the customer when a product is shipped
  Commit message with both ! and BREAKING CHANGE footer
  chore!: drop support for Node 6 

  BREAKING CHANGE: use JavaScript features not available in Node 6.
  Commit message with no body
  docs: correct spelling of CHANGELOG
  Commit message with scope
  feat(lang): add Polish language
  Commit message with multi-paragraph body and multiple footers
  fix: prevent racing of requests

  Introduce a request id and a reference to latest request. Dismiss
  incoming responses other than from latest request.

  Remove timeouts which were used to mitigate the racing issue but are
  obsolete now.

  Reviewed-by: Z
  Refs: #123
  */
