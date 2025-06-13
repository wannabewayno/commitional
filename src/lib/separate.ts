export default function separate<Item>(arr: Item[], filter: (item: Item) => boolean): [pass: Item[], fail: Item[]] {
  const pass: Item[] = [];
  const fail: Item[] = [];
  arr.forEach(item => (filter(item) ? pass : fail).push(item));

  return [pass, fail];
}
