import inquirer from "inquirer";

const COMMIT_TYPES = [
  { name: "feat: A new feature", value: "feat" },
  { name: "fix: A bug fix", value: "fix" },
  { name: "docs: Documentation only changes", value: "docs" },
  { name: "style: Changes that do not affect the meaning of the code", value: "style" },
  { name: "refactor: A code change that neither fixes a bug nor adds a feature", value: "refactor" },
  { name: "perf: A code change that improves performance", value: "perf" },
  { name: "test: Adding missing tests or correcting existing tests", value: "test" },
  { name: "build: Changes that affect the build system or external dependencies", value: "build" },
  { name: "ci: Changes to our CI configuration files and scripts", value: "ci" },
  { name: "chore: Other changes that don't modify src or test files", value: "chore" },
];

export interface CommitMessage {
  type: string;
  subject: string;
  body: string;
  breaking: boolean;
}

export async function promptCommitMessage(): Promise<CommitMessage> {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "type",
      message: "Select the type of change you're committing:",
      choices: COMMIT_TYPES,
      pageSize: 10,
    },
    {
      type: "input",
      name: "subject",
      message: "Write a short description of the change:",
      validate: (input: string) => {
        if (input.length === 0) return "Subject is required";
        if (input.length > 100) return "Subject must be 100 characters or less";
        if (input[0].toUpperCase() !== input[0]) return "Subject must start with a capital letter";
        if (input.endsWith(".")) return "Subject should not end with a period";
        return true;
      },
    },
    {
      type: "confirm",
      name: "hasBody",
      message: "Would you like to add a longer description?",
      default: false,
    },
    {
      type: "editor",
      name: "body",
      message: "Enter a longer description of the changes (optional):",
      when: (answers) => answers.hasBody,
      validate: (input: string) => {
        if (input.split("\n").some((line) => line.length > 100)) return "Body lines must wrap at 100 characters";
        return true;
      },
    },
    {
      type: "confirm",
      name: "breaking",
      message: "Are there any breaking changes?",
      default: false,
    },
  ]);

  return {
    type: answers.type,
    subject: answers.subject,
    body: answers.body || "",
    breaking: answers.breaking,
  };
}
