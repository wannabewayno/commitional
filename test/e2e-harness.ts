// e2e-harness.ts
import { spawn, type ChildProcess } from 'node:child_process';
import stripAnsiStream from 'strip-ansi-stream';
import { EventEmitter } from 'node:events';
import type Stream from 'node:stream';
import { PassThrough } from 'node:stream';

// Special key mappings
const KEY_MAP = {
  up: '\x1b[A',
  down: '\x1b[B',
  right: '\x1b[C',
  left: '\x1b[D',
  enter: '\r',
  tab: '\t',
  backspace: '\x08',
  escape: '\x1b',
  ctrlC: '\x03',
  space: ' ',
};

export class Keyboard {
  private process: ChildProcess;

  constructor(process: ChildProcess) {
    this.process = process;
  }

  async type(text: string): Promise<void> {
    console.log('type:', text);
    if (!this.process.stdin) throw new Error('Process stdin is closed');

    return new Promise(resolve => {
      // biome-ignore lint/style/noNonNullAssertion: Guard clause above.
      this.process.stdin!.write(text, 'utf8', () => resolve());
    });
  }

  get press() {
    return this;
  }

  private _press(key: keyof typeof KEY_MAP) {
    return this.type(KEY_MAP[key]);
  }

  enter(): Promise<void> {
    return this._press('enter');
  }

  tab(): Promise<void> {
    return this._press('tab');
  }

  esc(): Promise<void> {
    return this._press('escape');
  }

  backspace(): Promise<void> {
    return this._press('backspace');
  }

  CtrlC(): Promise<void> {
    return this._press('ctrlC');
  }

  up() {
    return this._press('up');
  }

  down() {
    return this._press('down');
  }

  left() {
    return this._press('left');
  }

  right() {
    return this._press('right');
  }
}

function wrapLine(line: string, limit: number): string[] {
  // Break the line into words
  const words = line.split(' ');

  let currentLineLength = 0;
  const lines: string[][] = [];

  // loop through the words, first calculating the new character count.
  // then dividing by the line length to find the lineIndex
  for (const word of words) {
    currentLineLength += word.length;
    const lineCount = Math.floor(currentLineLength / limit);
    lines[lineCount] ??= [];
    lines[lineCount].push(word);
  }

  return lines.map(line => line.join(' '));
}

// Screen and Color Screen?

export class Screen {
  private buffer = '';
  private emitter: EventEmitter = new EventEmitter();
  protected combinedStream = new PassThrough();
  private width: number;
  private height: number;
  private currentScreen = '';

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.combinedStream.on('data', data => this.updateScreen(data.toString()));
  }

  protected updateScreen(data: string) {
    console.log('update screen');
    this.buffer += data.toString();
    const lines = this.buffer.split('\n');
    const visibleLines = lines.slice(-this.height).map(line => wrapLine(line, this.width).join('\n'));
    this.currentScreen = visibleLines.join('\n');
    this.emitter.emit('update');
  }

  pipe(...streams: Stream.Readable[]) {
    streams.forEach(stream => stream.pipe(this.combinedStream));
  }

  getCombinedStream() {
    return this.combinedStream;
  }

  render(): string {
    return this.currentScreen;
  }

  waitForUpdate(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Screen update timeout'));
      }, timeout);

      this.emitter.once('update', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  async waitForIdle(idleDuration = 100, timeout = 5000): Promise<void> {
    let updateCount = 0;
    this.emitter.on('update', () => updateCount++);

    await this.waitForUpdate(timeout);

    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        reject(new Error('Screen idle timeout'));
      }, timeout);

      let idleTimer: NodeJS.Timeout;
      let lastCount = updateCount;

      const checkIdle = () => {
        if (updateCount === lastCount) {
          clearTimeout(timeoutTimer);
          resolve();
        } else {
          lastCount = updateCount;
          idleTimer = setTimeout(checkIdle, idleDuration);
        }
      };

      idleTimer = setTimeout(checkIdle, idleDuration);
    });
  }
}

// The same as Screen, but strips ansi
// Handy for functional assetions
export class CleanScreen extends Screen {
  constructor(width: number, height: number) {
    super(width, height);
    this.combinedStream.destroy();
    this.combinedStream = stripAnsiStream();
    this.combinedStream.on('data', data => this.updateScreen(data.toString()));
  }
}

export function useInteractiveShell(
  command: string,
  options: { width: number; height: number },
): [Keyboard, CleanScreen, Screen] {
  const child = spawn(command, {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const colorScreen = new Screen(options.width, options.height);
  const screen = new CleanScreen(options.width, options.height);

  // Tee the output to both screens
  const stdoutTee = new PassThrough();
  const stderrTee = new PassThrough();

  child.stdout.pipe(stdoutTee);
  child.stderr.pipe(stderrTee);

  screen.pipe(child.stdout, child.stderr);
  colorScreen.pipe(stderrTee, stdoutTee);

  return [new Keyboard(child), screen, colorScreen];
}
