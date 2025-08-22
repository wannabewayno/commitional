import { BaseRuleWithValue, type RuleConfigCondition, type RuleConfigSeverity } from './BaseRule.js';
import type { RuleScope } from '../index.js';
import capitalize from '../../lib/capitalize.js';
import kebabCase from '../../lib/kebabCase.js';
import splitByWord from '../../lib/splitByWord.js';

export type CaseType =
  | 'lower-case'
  | 'upper-case'
  | 'camel-case'
  | 'kebab-case'
  | 'pascal-case'
  | 'sentence-case'
  | 'snake-case'
  | 'start-case';

const knownCases: CaseType[] = [
  'lower-case',
  'upper-case',
  'camel-case',
  'kebab-case',
  'pascal-case',
  'sentence-case',
  'snake-case',
  'start-case',
];

export class CaseRule extends BaseRuleWithValue<CaseType[]> {
  constructor(name: RuleScope, level: RuleConfigSeverity, applicable: RuleConfigCondition, value: CaseType | CaseType[]) {
    value = !Array.isArray(value) ? [value] : value;
    super(name, level, applicable, value);
  }

  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(
      parts.map((part, idx) => [idx, !this.validateCase(part) && this.describe()]).filter(([, err]) => err),
    );
    return Object.keys(errs).length ? errs : null;
  }

  private validateCase(input: string): boolean {
    if (!input) return true;

    const hasCase = this.value.some(caseType => this.matchesCase(input, caseType));
    return this.applicable === 'always' ? hasCase : !hasCase;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    // target case is either the first allowed case or the first case that doesn't match a non-allowed case;
    const caseType = this.applicable === 'never' ? knownCases.find(v => !this.value.includes(v)) : this.value[0];

    // Couldn't fix - return original parts with errors
    if (!caseType) {
      const errs = this.validate(parts);
      return [errs, parts];
    }

    const fixed = parts.map(part => {
      // Nothing to fix, return as-is
      if (!part) return part;

      // fix the case
      return this.fixCase(part, caseType);
    });

    return [null, fixed];
  }

  private fixCase(input: string, caseType: CaseType): string {
    switch (caseType) {
      case 'lower-case':
        return input.toLowerCase();
      case 'upper-case':
        return input.toUpperCase();
      case 'sentence-case':
        return capitalize(splitByWord(input).join(' ').toLowerCase());
      case 'start-case':
        return splitByWord(input)
          .map(word => capitalize(word.toLowerCase()))
          .join(' ');
      case 'camel-case': {
        const [first, ...rest] = splitByWord(input) as [string, ...string[]];
        return [first.toLowerCase()]
          .concat(rest.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
          .join('');
      }
      case 'kebab-case':
        return kebabCase(input);
      case 'snake-case':
        return splitByWord(input)
          .map(word => word.toLowerCase())
          .join('_');
      case 'pascal-case':
        return splitByWord(input)
          .map(word => capitalize(word.toLowerCase()))
          .join('');
      default:
        throw new Error(`unrecognised case ${caseType}`);
    }
  }

  describe(): string {
    const message = ['The', this.scope, 'must', this.applicable, 'be in'];
    if (this.value.length === 1) {
      const caseStr = this.value[0] as CaseType;
      message.push(this.fixCase(caseStr, caseStr));
    } else {
      const [last, ...rest] = this.value as [CaseType, ...CaseType[]];

      // convert cases to their own representations for readability.
      const restStr = rest.map(v => this.fixCase(v, v)).join(', ');
      const lastStr = this.fixCase(last, last);

      message.push(`either ${restStr} or ${lastStr}`);
    }

    return message.join(' ');
  }

  private matchesCase(input: string, caseType: CaseType): boolean {
    if (!input) return true;

    switch (caseType) {
      case 'lower-case':
        return input === input.toLowerCase();
      case 'upper-case':
        return input === input.toUpperCase();
      case 'camel-case':
        return /^[a-z][a-zA-Z0-9]*$/.test(input);
      case 'kebab-case':
        return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(input);
      case 'pascal-case':
        return /^[A-Z][a-zA-Z0-9]*$/.test(input);
      case 'sentence-case':
        return /^[A-Z][^.!?]*$/.test(input);
      case 'snake-case':
        return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(input);
      case 'start-case':
        return input.split(' ').every(word => word && word[0] === word[0]?.toUpperCase());
      default:
        return false;
    }
  }
}
