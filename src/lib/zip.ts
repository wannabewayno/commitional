interface ZipOpts<DefaultA, DefaultB> {
  defaultA?: DefaultA;
  defaultB?: DefaultB;
}

// @ts-ignore
export function zip<A, B, C = undefined, D = C>(
  a: A[],
  b: B[],
  { defaultA, defaultB = defaultA }: ZipOpts<C, D> = {},
): [A | C, B | D][] {
  const length = Math.max(a.length, b.length);
  const result: [A | C, B | D][] = [];

  for (let i = 0; i < length; i++) {
    // @ts-ignore: I can't seem to tell the language server that defaultA and deafultB may be undefined and if so, that's ok, we've alloweed for it.
    result.push([a[i] ?? defaultA, b[i] ?? defaultB]);
  }

  return result;
}
