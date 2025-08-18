import { BaseRule } from './BaseRule.js';

export class ExclamationMarkRule extends BaseRule {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(parts.map((part, idx) => [idx, !this.validateExclamationMark(part) && this.exclamationMarkErrorMessage()]).filter(([, err]) => err));
    return Object.keys(errs).length ? errs : null;
  }

  private validateExclamationMark(input: string): boolean {
    const hasExclamationMarkBeforeTheColon = input.includes('!:');
    return this.applicable === 'always' ? hasExclamationMarkBeforeTheColon : !hasExclamationMarkBeforeTheColon;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    const fixed = parts.map(part => {
      if (this.applicable === 'always' && !part.includes('!:')) {
        const colonIndex = part.indexOf(':');
        if (colonIndex > 0) {
          return `${part.slice(0, colonIndex)}!${part.slice(colonIndex)}`;
        }
      }

      if (this.applicable === 'never' && part.includes('!:')) {
        return part.replace('!:', ':');
      }

      return part;
    });
    
    return [null, fixed];
  }

  private exclamationMarkErrorMessage(): string {
    const modifier = this.applicable === 'always' ? 'must' : 'must not';
    return `the ${this.scope} ${modifier} have an exclamation mark before the colon`;
  }
}
