interface Mappers<Item, P, F> {
  onPass?: (item: Item) => P;
  onFail?: (item: Item) => F;
}

export default function separate<Item, P = Item, F = Item>(
  arr: Item[],
  filter: (item: Item) => boolean,
  mappers: Mappers<Item, P, F> = {},
): [pass: P[], fail: F[]] {
  if (mappers.onPass === undefined) mappers.onPass = (item: Item) => item as unknown as P;
  if (mappers.onFail === undefined) mappers.onFail = (item: Item) => item as unknown as F;
  const { onPass, onFail } = mappers;

  const pass: P[] = [];
  const fail: F[] = [];

  arr.forEach(item => {
    if (filter(item)) pass.push(onPass(item));
    else fail.push(onFail(item));
  });

  return [pass, fail];
}
