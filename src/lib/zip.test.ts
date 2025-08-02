import { expect } from 'chai';
import { zip } from './zip.js';

describe('zip', () => {
  it('zips two arrays of equal length', () => {
    const result = zip([1, 2, 3], ['a', 'b', 'c']);
    expect(result).to.equal([[1, 'a'], [2, 'b'], [3, 'c']]);
  });

  it('stops at shorter array length', () => {
    const result = zip([1, 2, 3, 4], ['a', 'b']);
    expect(result).to.equal([[1, 'a'], [2, 'b']]);
  });

  it('handles empty arrays', () => {
    expect(zip([], [])).to.equal([]);
    expect(zip([1, 2], [])).to.equal([]);
    expect(zip([], ['a', 'b'])).to.equal([]);
  });
});

