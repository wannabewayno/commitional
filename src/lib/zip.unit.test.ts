import { expect } from 'chai';
import { zip } from './zip.js';

describe('zip', () => {
  it('zips two arrays of equal length', () => {
    const result = zip([1, 2, 3], ['a', 'b', 'c']);
    expect(result).to.deep.equal([
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ]);
  });

  it('extends to longer array length with undefined defaults', () => {
    const result = zip([1, 2, 3, 4], ['a', 'b']);
    expect(result).to.deep.equal([
      [1, 'a'],
      [2, 'b'],
      [3, undefined],
      [4, undefined],
    ]);
  });

  it('extends to longer array length with custom defaults', () => {
    const result = zip([1, 2], ['a', 'b', 'c', 'd'], { defaultA: 0, defaultB: 'z' });
    expect(result).to.deep.equal([
      [1, 'a'],
      [2, 'b'],
      [0, 'c'],
      [0, 'd'],
    ]);
  });

  it('uses defaultB when provided, otherwise falls back to defaultA', () => {
    const result = zip([1], ['a', 'b', 'c'], { defaultA: 0 });
    expect(result).to.deep.equal([
      [1, 'a'],
      [0, 'b'],
      [0, 'c'],
    ]);
  });

  it('handles empty arrays', () => {
    expect(zip([], [])).to.deep.equal([]);
  });

  it('handles one empty array with defaults', () => {
    const result = zip([], ['a', 'b'], { defaultA: 0 });
    expect(result).to.deep.equal([
      [0, 'a'],
      [0, 'b'],
    ]);
  });
});
