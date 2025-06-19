// e2e.test.ts
import { type Keyboard, type Screen, useInteractiveShell } from './e2e-harness.js';
import { expect } from 'chai';
import { before, it } from 'mocha';

// Helper function to pause execution for specified milliseconds
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// biome-ignore lint/suspicious/noFocusedTests: <explanation>
describe.only('CLI E2E Tests', () => {
  let I: Keyboard;
  let screen: Screen;

  before(() => {
    [I, screen] = useInteractiveShell('commitional', {
      width: 100,
      height: 50,
    });
  });

  it('should display typed input', async () => {
    // const update = screen.waitForUpdate();
    await I.press.down();
    await screen.waitForIdle();
    // await sleep(400);
    // console.log(screen.render())
    expect(screen.render()).to.include('❯ fix');
  });

  it('should handle multi-line output', async () => {
    await I.press.enter();
    await screen.waitForIdle();
    const output = screen.render();
    console.log(output);
    expect(output).to.match(/Command/);
    expect(output).to.match(/Result:/);
  });
});
