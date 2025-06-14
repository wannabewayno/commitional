type NoUndefined<T> = Exclude<T, undefined>;

export default function filterMap<Item, R = Item>(
  arr: Item[],
  filter: (item: Item) => NoUndefined<R> | undefined = (item: Item) => item as NoUndefined<R> | undefined,
): R[] {
  return arr.reduce((pass, item) => {
    const result = filter(item);
    if (result !== undefined) pass.push(result);
    return pass;
  }, [] as R[]);
}
