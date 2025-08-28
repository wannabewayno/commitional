export default function testHook<Context extends Record<string, unknown>>(
  fn: () => [ctx: Context, teardown?: () => Promise<void> | void],
): Context {
  const ctx = {} as Context;
  let teardown: (() => Promise<void> | void) | undefined;

  beforeEach(async () => {
    const hook = await fn();
    Object.assign(ctx, hook[0]);

    teardown = hook[1];
  });

  afterEach(async () => {
    if (teardown) await teardown();
  });

  return ctx;
}
