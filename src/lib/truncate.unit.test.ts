import { expect } from 'chai';
import { truncate } from './truncate.js';

describe('[lib] - truncate', () => {
  it('should return empty string', () => {
    const truncated = truncate('', 30);
    expect(truncated).to.equal('');
  });

  it('should return string untruncated if under max length', () => {
    const testString = 'smaller than 30 characters'; // 26 characters
    const truncated = truncate(testString, 30);
    expect(truncated).to.equal(testString);
  });

  it('should truncate text longer than max length to max length with an elipsis', () => {
    const testString = 'This text will be truncated as it is greater than 30 characters'; // 63
    const truncated = truncate(testString, 30);

    expect(truncated).to.equal('This text will be truncated...');
  });
});
