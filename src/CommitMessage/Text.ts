export type StyleFn = (text: string) => string;

export default class Text {
  private styled = false;

  constructor(
    public value = '',
    private _style: StyleFn = (text: string) => text,
  ) {}

  setStyle(style?: StyleFn) {
    if (style) this._style = style;
    return this;
  }

  style() {
    this.styled = true;
    return this;
  }

  unstyle() {
    this.styled = false;
    return this;
  }

  get endsWith() {
    return this.value.endsWith;
  }

  get startsWith() {
    return this.value.startsWith;
  }

  get replace() {
    return this.value.replace;
  }

  valueOf() {
    return this.toString();
  }

  toString() {
    return this.styled ? this._style(this.value) : this.value;
  }

  toJSON() {
    return { value: this.value, styled: this.styled };
  }
}
