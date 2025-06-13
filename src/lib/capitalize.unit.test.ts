import { expect } from 'chai';
import capitalize from './capitalize.js';

describe('capitalize', () => {
  it('Should capitalize a lowercase string', () => {
    expect(capitalize('capital')).to.equal('Capital');
  });

  it('Should leave uppercase characters unaffected', () => {
    expect(capitalize('CAPITAL')).to.equal('CAPITAL');
  });

  it('Should not affect other characters', () => {
    expect(capitalize('caPitaL_m8')).to.equal('CaPitaL_m8');
  });
});
