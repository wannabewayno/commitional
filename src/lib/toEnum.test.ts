import { expect } from 'chai';
import toEnum from './toEnum.js';

describe('toEnum', () => {
  it('should convert string array to enum string format', () => {
    const input = ['apple', 'banana', 'cherry'];
    const result = toEnum(input);
    expect(result).to.equal('"apple"|"banana"|"cherry"');
  });

  it('should convert object keys to enum string format', () => {
    const input = { apple: 1, banana: 2, cherry: 3 };
    const result = toEnum(input);
    expect(result).to.equal('"apple"|"banana"|"cherry"');
  });

  it('should handle empty array', () => {
    const input: string[] = [];
    const result = toEnum(input);
    expect(result).to.equal('""');
  });

  it('should handle empty object', () => {
    const input = {};
    const result = toEnum(input);
    expect(result).to.equal('""');
  });
});
