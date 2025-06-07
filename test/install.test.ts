import { expect } from 'chai';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { findPackageJSON } from 'node:module';

class JavascriptRuntime {
  name: string;
  private checkCommand: string;
  private initCommand: string;
  private installCommandFn: (packagePath: string) => string;
  private runCommand: string;

  constructor(config: {
    name: string;
    checkCommand: string;
    initCommand: string;
    installCommand: (packagePath: string) => string;
    runCommand: string;
  }) {
    this.name = config.name;
    this.checkCommand = config.checkCommand;
    this.initCommand = config.initCommand;
    this.installCommandFn = config.installCommand;
    this.runCommand = config.runCommand;
  }

  isAvailable(): boolean {
    try {
      execSync(this.checkCommand, { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  init(): void {
    execSync(this.initCommand, { stdio: 'ignore' });

    // expect package.json to exist after initing the package.
    expect(fs.existsSync('package.json')).to.be.true;
  }

  install(packagePath: string): void {
    execSync(this.installCommandFn(packagePath), { stdio: 'ignore' });
  }

  run(): string {
    return execSync(this.runCommand).toString().trim();
  }

  static Node(): JavascriptRuntime {
    return new JavascriptRuntime({
      name: 'npm',
      checkCommand: 'npm --version',
      initCommand: 'npm init -y',
      installCommand: (packagePath: string) => `npm install ${packagePath}`,
      runCommand: 'npx commitional --version',
    });
  }

  static Bun(): JavascriptRuntime {
    return new JavascriptRuntime({
      name: 'bun',
      checkCommand: 'bun --version',
      initCommand: 'bun init -y',
      installCommand: (packagePath: string) => `bun add ${packagePath}`,
      runCommand: 'bunx commitional --version',
    });
  }
}

describe('Package Installation Tests', function () {
  let packageVersion: string;
  let packagePath: string;

  before(() => {
    const packageJSONPath = findPackageJSON('..', import.meta.url);
    if (!packageJSONPath) throw new Error('Could not find package.json');

    // dirname of this
    packagePath = path.dirname(packageJSONPath);

    const pkg = JSON.parse(fs.readFileSync(packageJSONPath, 'utf-8'));
    packageVersion = pkg.version;
    expect(packageVersion).to.match(/^\d+\.\d+\.\d+$/);
  });

  // These tests can take longer than the default timeout
  this.timeout(12_000);

  // Define runtime configurations
  const runtimes = [JavascriptRuntime.Bun(), JavascriptRuntime.Node()];

  const originalDir = process.cwd();
  let tempDir: string;

  beforeEach('Initialize Runtime and temp directory', () => {
    // Create temp directory
    tempDir = path.join(os.tmpdir(), `commitional-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Change to the temp directory
    process.chdir(tempDir);
  });

  afterEach('Clean up temp directory', () => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Return to original directory
    process.chdir(originalDir);
  });

  // Test each runtime
  runtimes.forEach(runtime => {
    it(`should install and run correctly with ${runtime.name}`, function () {
      // Skip test if runtime is not installed
      if (!runtime.isAvailable()) return this.skip();

      // Initialize a new project
      runtime.init();

      // Install local package
      runtime.install(packagePath);

      // Run the CLI to check version
      const version = runtime.run();

      // Verify version
      expect(version).to.equal(packageVersion);
    });
  });
});
