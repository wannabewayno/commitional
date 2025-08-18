type ExtractItem<T> = T extends (infer U)[] ? U : T extends Set<infer U> ? U : never;

interface Mappers<Item, P, F> {
  onPass?: (item: Item) => P;
  onFail?: (item: Item) => F;
}

function createIterator<Item, P, F>(iterable: Item[] | Set<Item>, onPass: (item: Item) => P, onFail: (item: Item) => F, filter: (item: Item) => boolean) {

  if (Array.isArray(iterable)) {
    const pass: P[] = [];
    const fail: F[] = [];

    return {
      pass,
      fail,
      iterator: (item: Item) => filter(item) ? pass.push(onPass(item)) : fail.push(onFail(item))
    }
  }

  const pass = new Set<P>();
  const fail = new Set<F>();
  
  return {
    pass,
    fail,
    iterator: (item: Item) => filter(item) ? pass.add(onPass(item)) : fail.add(onFail(item)),
  }
} 

export default function separate<T extends Item[] | Set<Item>, Item = ExtractItem<T>, P = Item, F = Item>(
  iterable: T,
  filter: (item: Item) => boolean,
  mappers: Mappers<Item, P, F> = {},
): [pass: T extends Set<Item> ? Set<P> : P[], fail: T extends Set<Item> ? Set<F> : F[]] {

  if (mappers.onPass === undefined) mappers.onPass = (item: Item) => item as unknown as P;
  if (mappers.onFail === undefined) mappers.onFail = (item: Item) => item as unknown as F;

  const { onPass, onFail } = mappers;

  const { pass, fail, iterator } = createIterator<Item, P, F>(iterable, onPass, onFail, filter);

  iterable.forEach(iterator);

  return [pass as T extends Set<Item> ? Set<P> : P[], fail as T extends Set<Item> ? Set<F> : F[]];
}
