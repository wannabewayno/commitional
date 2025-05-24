#!/usr/bin/env node

import { Command } from "commander";
import packageJSON from "../package.json" with { type: "json" };

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("commitional")
    .description("CLI tool for crafting commit messages - compatible with commitlint")
    .version(packageJSON.version, "-v, --version", "Output the current version")
    .addHelpCommand("help [command]", "Display help for command");

  // Set up the default action when no command is provided
  program.action(async () => {
    console.log("Commit message creation functionality coming soon!");
    process.exit(0);
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
