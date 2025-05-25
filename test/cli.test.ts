import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const binPath = path.join(__dirname, '..', 'bin', 'commitional.js');

// Create a temporary directory for tests
const tempDir = mkdtempSync(path.join(tmpdir(), 'commitional-test-'));

describe('CLI Tests', () => {
  it('should display version information', () => {
    const output = execSync(`node ${binPath} --version`, {
      cwd: tempDir,
      env: { ...process.env, HOME: tempDir },
    }).toString();
    assert.match(output, /\d+\.\d+\.\d+/);
  });

  it('should display help information', () => {
    const output = execSync(`node ${binPath} --help`, {
      cwd: tempDir,
      env: { ...process.env, HOME: tempDir },
    }).toString();
    assert.ok(output.includes('Usage: commitional [options]'));
    assert.ok(output.includes('CLI tool for crafting commit messages'));
    assert.ok(output.includes('Options:'));
  });
});
