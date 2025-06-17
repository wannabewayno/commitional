import { expect } from 'chai';
import Highlighter, { type styleFn } from './highlighter.js'; // Adjust the import path as necessary

describe('Highlighter function', () => {
  const valueStyle: styleFn = (value: string) => `**${value}**`;
  const defaultStyle: styleFn = (value: string) => `__${value}__`;

  it('should apply valueStyle when value is provided', () => {
    const highlight = Highlighter(valueStyle, defaultStyle);
    const result = highlight('testValue');
    expect(result).to.be.equal('**testValue**');
  });

  it('should apply defaultStyle when value is not provided and defaultValue is provided', () => {
    const highlight = Highlighter(valueStyle, defaultStyle);
    const result = highlight(undefined, 'defaultValue');
    expect(result).to.be.equal('__defaultValue__');
  });

  it('should apply defaultStyle with "unknown" when neither value nor defaultValue is provided', () => {
    const highlight = Highlighter(valueStyle, defaultStyle);
    const result = highlight();
    expect(result).to.be.equal('__unknown__');
  });

  it('should use valueStyle as defaultStyle when defaultStyle is not provided', () => {
    const highlight = Highlighter(valueStyle);
    const result = highlight(undefined, 'defaultValue');
    expect(result).to.be.equal('**defaultValue**');
  });

  it('should use valueStyle as defaultStyle with "unknown" when neither value nor defaultValue is provided', () => {
    const highlight = Highlighter(valueStyle);
    const result = highlight();
    expect(result).to.be.equal('**unknown**');
  });
});
