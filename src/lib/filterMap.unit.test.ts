import { expect } from 'chai';
import filterMap from './filterMap.js';

describe('filterMap', () => {
  const numberMap: Record<number, string> = {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
  };

  const values = [0, 1, undefined, 3, 4, 5, null, 7, 8, 9];

  it('Should filter out all undefined values from the list when no filter function is defined', () => {
    const noUndefined = filterMap(values);
    expect(noUndefined).to.deep.equal([0, 1, 3, 4, 5, null, 7, 8, 9]);
  });

  it('Should filter out falsey items', () => {
    const truthyItems = filterMap(values, number => (!number ? undefined : number));
    expect(truthyItems).to.deep.equal([1, 3, 4, 5, 7, 8, 9]);
  });

  it('Should filter out items under 7 and map them to strings', () => {
    const strings = filterMap(values, number => ((!!number || number === 0) && number < 7 ? numberMap[number] : undefined));
    expect(strings).to.deep.equal(['zero', 'one', 'three', 'four', 'five']);
  });
});
