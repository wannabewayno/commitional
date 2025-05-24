#!/usr/bin/env node

import { Command } from "commander";
import packageJSON from "../package.json" with { type: "json" };
import { promptCommitMessage } from "./prompts.js";
import { formatCommitMessage } from "./lib/formatCommitMessage.js";
import {
  isGitRepository,
  getStagedFiles,
  getStagedDiff,
} from "./lib/gitUtils.js";

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("commitional")
    .description("CLI tool for crafting commit messages - compatible with commitlint")
    .version(packageJSON.version, "-v, --version", "Output the current version")
    .addHelpCommand("help [command]", "Display help for command");

  // Set up the default action when no command is provided
  program.action(async () => {
    try {
      // Check if we're in a git repository first
      const isRepo = await isGitRepository();
      if (!isRepo) {
        console.error("Error: Not in a Git repository");
        process.exit(1);
      }

      if (isRepo) {
        const stagedFiles = await getStagedFiles();
        console.log("\nStaged Files:");
        console.log("-------------");
        if (stagedFiles.length > 0) stagedFiles.forEach(file => console.log(file));
        else console.log("No files staged");

        const diff = await getStagedDiff();
        if (diff) {
          console.log("\nStaged Changes:");
          console.log("--------------");
          console.log(diff);
        }
      }

      const commitMessage = await promptCommitMessage();
      const formattedMessage = formatCommitMessage(commitMessage);
      console.log("\nGenerated commit message:");
      console.log("------------------------");
      console.log(formattedMessage);
      console.log("------------------------");
      // In a real implementation, we might want to write this to a file
      // or pipe it to git commit, but for now we'll just display it
      process.exit(0);
    } catch (error) {
      console.error("Error creating commit message:", error);
      process.exit(1);
    }
  });

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main().catch((error: Error) => {
  console.error("Error:", error);
  process.exit(1);
});
