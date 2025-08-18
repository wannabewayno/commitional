import { BaseRuleWithValue } from './BaseRule.js';

export class FullStopRule extends BaseRuleWithValue<string> {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(parts.map((part, idx) => [idx, !this.validateFullStop(part) && this.fullStopErrorMessage()]).filter(([, err]) => err));
    return Object.keys(errs).length ? errs : null;
  }

  private validateFullStop(input: string): boolean {
    const endsWithFullStop = input.endsWith(this.value);
    return this.applicable === 'always' ? endsWithFullStop : !endsWithFullStop;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    const fixed = parts.map(part => {
      if (this.applicable === 'always' && !part.endsWith(this.value)) {
        return part + this.value;
      }

      if (this.applicable === 'never' && part.endsWith(this.value)) {
        return part.slice(0, -this.value.length);
      }

      return part;
    });
    
    return [null, fixed];
  }

  private get symbolName() {
    switch (this.value) {
      case '.':
        return 'full stop';
      case '!':
        return 'exclamation mark';
      case '*':
        return 'asterix';
      case '|':
        return 'vertical bar';
      case '$':
        return 'dollar sign';
      case '@':
        return 'At sign';
      case '&':
        return 'ampersand';
      case '^':
        return 'carrot';
      case '#':
        return 'hash';
      case '+':
        return 'plus sign';
      case '-':
        return 'hyphen';
      case '=':
        return 'equals sign';
      case ':':
        return 'colon';
      case ';':
        return 'semicolon';
      case '?':
        return 'question mark';
      case ',':
        return 'comma';
      case '/':
        return 'slash';
      case '\\':
        return 'backslash';
      case '_':
        return 'underscore';
      case ']':
        return 'closing square bracket';
      case '[':
        return 'opening square bracket';
      case ')':
        return 'closing paranthesis';
      case '(':
        return 'opening paranthesis';
      case "'":
        return 'apostrophe';
      case '"':
        return 'quotation mark';
      case '%':
        return 'percent sign';
      case '~':
        return 'tilde';
      case '`':
        return 'backtick';
      default:
        return `'${this.value}'`;
    }
  }

  private indefiniteArticle(text: string): string {
    const article = /^[aeiou]/i.test(text) ? 'an' : 'a';
    return `${article} ${text}`;
  }

  private fullStopErrorMessage(): string {
    const modifier = this.applicable === 'always' ? 'must' : 'must not';
    return `the ${this.scope} ${modifier} end with ${this.indefiniteArticle(this.symbolName)}`;
  }
}
