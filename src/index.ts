#!/usr/bin/env node

async function main(): Promise<void> {
  console.log("Welcome to commitional!");
  // TODO: Implement CLI functionality
}

// if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((error: Error) => {
    console.error("Error:", error);
    process.exit(1);
  });
// }
