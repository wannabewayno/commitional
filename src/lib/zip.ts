export function zip<A, B>(a: A[], b: B[]): [A, B][] {
  const length = Math.min(a.length, b.length);
  const result: [A, B][] = [];
  
  for (let i = 0; i < length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: We've checked the length on line 2, it definitely exists
    result.push([a[i]!, b[i]!]);
  }
  
  return result;
}