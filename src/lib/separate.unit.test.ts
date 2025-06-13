import { expect } from 'chai';
import separate from './separate.js';

describe('separate', () => {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  it('Should separate a list items with a filter function and return items that passed the filter and the items that failed the fitler', () => {
    const [lessThan7, greaterThan7] = separate(numbers, number => number < 7);
    expect(lessThan7).to.deep.equal([0, 1, 2, 3, 4, 5, 6]);
    expect(greaterThan7).to.deep.equal([7, 8, 9]);
  });
});
