import { expect } from 'chai';
import { parseAutoPushEnv, resolveAutoPush } from './autoPush.js';

describe('parseAutoPushEnv', () => {
  const recognizedCases: Array<{
    raw: string;
    expected: 'truthy' | 'falsy';
  }> = [
    { raw: 'true', expected: 'truthy' },
    { raw: 'TRUE', expected: 'truthy' },
    { raw: '  true  ', expected: 'truthy' },
    { raw: '1', expected: 'truthy' },
    { raw: ' 1 ', expected: 'truthy' },
    { raw: 'yes', expected: 'truthy' },
    { raw: 'Yes', expected: 'truthy' },
    { raw: 'false', expected: 'falsy' },
    { raw: 'FALSE', expected: 'falsy' },
    { raw: '  false  ', expected: 'falsy' },
    { raw: '0', expected: 'falsy' },
    { raw: ' 0 ', expected: 'falsy' },
    { raw: 'no', expected: 'falsy' },
    { raw: 'No', expected: 'falsy' },
    { raw: '', expected: 'falsy' },
    { raw: '  ', expected: 'falsy' },
  ];

  for (const { raw, expected } of recognizedCases) {
    it(`returns ${expected} for ${JSON.stringify(raw)}`, () => {
      expect(parseAutoPushEnv(raw)).to.equal(expected);
    });
  }

  it('returns unset when the environment variable is undefined', () => {
    expect(parseAutoPushEnv(undefined)).to.equal('unset');
  });

  for (const raw of ['maybe', '2', 'tru', 'on']) {
    it(`returns unrecognized for ${JSON.stringify(raw)}`, () => {
      expect(parseAutoPushEnv(raw)).to.equal('unrecognized');
    });
  }
});

describe('resolveAutoPush', () => {
  const envCases: Array<{
    label: string;
    raw: string | undefined;
    enabled: boolean;
    unrecognized: boolean;
  }> = [
    { label: 'truthy env', raw: 'true', enabled: true, unrecognized: false },
    { label: 'falsy env', raw: 'false', enabled: false, unrecognized: false },
    { label: 'unrecognized env', raw: 'maybe', enabled: false, unrecognized: true },
    { label: 'unset env', raw: undefined, enabled: false, unrecognized: false },
  ];

  const resolutionCases = envCases.flatMap(env =>
    [false, true].flatMap(push => [false, true].map(noPush => ({ env, push, noPush }))),
  );

  for (const { env, push, noPush } of resolutionCases) {
    it(`resolves push=${push}, noPush=${noPush}, ${env.label}`, () => {
      const resolution = resolveAutoPush({
        push,
        noPush,
        env: env.raw,
      });
      const expectedEnabled = noPush ? false : push ? true : env.enabled;
      const expectedWarning =
        !push && !noPush && env.unrecognized
          ? `COMMITIONAL_AUTO_PUSH has an unrecognized value "${env.raw}"; auto-push is disabled. Use one of: true, 1, yes, false, 0, no.`
          : undefined;

      expect(resolution.enabled).to.equal(expectedEnabled);
      expect(resolution.warning).to.equal(expectedWarning);
    });
  }
});
