import assert from "node:assert";
import { execSync } from "node:child_process";

describe("CLI Tests", () => {
  it("should display version information", () => {
    const output = execSync("node ./bin/commitional.js --version").toString();
    assert.match(output, /\d+\.\d+\.\d+/);
  });

  it("should display help information", () => {
    const output = execSync("node ./bin/commitional.js --help").toString();
    assert.ok(output.includes("Usage: commitional [options]"));
    assert.ok(output.includes("CLI tool for crafting commit messages"));
    assert.ok(output.includes("Options:"));
  });
});
