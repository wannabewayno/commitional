import { expect } from 'chai';
import separate from './separate.js';

describe('separate', () => {
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
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  it('Should separate list items with a filter function and return items that passed the filter and the items that failed the fitler', () => {
    const [lessThan7, notLessThan7] = separate(numbers, number => number < 7);
    expect(lessThan7).to.deep.equal([0, 1, 2, 3, 4, 5, 6]);
    expect(notLessThan7).to.deep.equal([7, 8, 9]);
  });

  it('Should separate and map items that pass into strings and leave items that failed untouched', () => {
    const [lessThan7, notLessThan7] = separate(numbers, number => number < 7, { onPass: number => numberMap[number] });
    expect(lessThan7).to.deep.equal(['zero', 'one', 'two', 'three', 'four', 'five', 'six']);
    expect(notLessThan7).to.deep.equal([7, 8, 9]);
  });

  it('Should separate and map items that fail into strings and leave items that passed untouched', () => {
    const [lessThan7, notLessThan7] = separate(numbers, number => number < 7, { onFail: number => numberMap[number] });
    expect(lessThan7).to.deep.equal([0, 1, 2, 3, 4, 5, 6]);
    expect(notLessThan7).to.deep.equal(['seven', 'eight', 'nine']);
  });

  it('Should separate list items with a filter function and return items mapped to strings', () => {
    const [lessThan7, notLessThan7] = separate(numbers, number => number < 7, {
      onPass: number => numberMap[number],
      onFail: number => numberMap[number],
    });
    expect(lessThan7).to.deep.equal(['zero', 'one', 'two', 'three', 'four', 'five', 'six']);
    expect(notLessThan7).to.deep.equal(['seven', 'eight', 'nine']);
  });
});
