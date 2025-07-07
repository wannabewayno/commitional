import sentaceKebabCase from '../lib/sentenceKebabCase.js';
import type RulesEngine from '../RulesEngine/index.js';
import type { ErrorsAndWarnings } from './interfaces.js';
import type { StyleFn } from './Text.js';

export default class CommitMessageFooter {
  private _style: StyleFn = (text: string) => text;
  private styled = false;

  constructor(
    private _token: string,
    private _text: string,
  ) {}

  get token(): string {
    return this._token;
  }

  set token(value: string) {
    let trimmedValue = value.trim();
    if (!trimmedValue) return;
    // Force Sentance-kebab-case except for 'BREAKING CHANGE' and 'BREAKING-CHANGE' [1][2][3]
    if (!['BREAKING CHANGE', 'BREAKING-CHANGE'].includes(trimmedValue)) trimmedValue = sentaceKebabCase(trimmedValue);
    this._token = value;
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    this._text = value;
  }

  process(rulesEngine: RulesEngine): [footer: CommitMessageFooter, info?: ErrorsAndWarnings] {
    const [output, errors, warnings] = rulesEngine.narrow('footer').parse(this.toString());
    const footer = CommitMessageFooter.fromString(output);

    if (footer instanceof Error) {
      errors.push(footer.message);

      const validFooter = CommitMessageFooter.fromString(`Error: ${output}`);
      if (validFooter instanceof Error) throw validFooter;

      return [validFooter, { type: 'footer', filter: 'Error', errors, warnings }];
    }

    return [footer, !errors.length ? undefined : { type: 'footer', filter: footer.token, errors, warnings }];
  }

  setStyle(style: StyleFn) {
    this._style = style;
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

  toString() {
    const footer = `${this.token}: ${this.text}`;
    return this.styled ? this._style(footer) : footer;
  }

  static fromString(footer: string): CommitMessageFooter | Error {
    const match = footer.match(/^(?<token>[\w-]+): (?<text>.*)$/i);
    if (!match || !match.groups?.token || !match.groups?.text)
      return new Error(`[Invalid footer] '${footer}' is does not conform to "<Some-token>: <text content>"`);

    return new CommitMessageFooter(match.groups.token, match.groups.text);
  }
}

/*
  References:
  [1] 'BREAKING CHANGE' in footer: Conventional Commits v1.0.0 > Specification > rule 12; Available: https://www.conventionalcommits.org/en/v1.0.0/
  [2] 'BREAKING CHANGE' must be synonymous with 'BREAKING-CHANGE': Conventional Commits v1.0.0 > Specification > rule 16; Available: https://www.conventionalcommits.org/en/v1.0.0/
  [3] 'BREAKING CHANGE' must be uppercase: Conventional Commits v1.0.0 > Specification > rule 15; Available: https://www.conventionalcommits.org/en/v1.0.0/
*/
