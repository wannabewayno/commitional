import { BaseRuleWithValue, type RuleConfigCondition, type RuleConfigSeverity } from './BaseRule.js';
import type { CommitPart } from '../index.js';

function capitalize(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function delimiter(string: string, delimiter = ' ') {
  // target all common delimiter types and replace with the new delimter
  return string.replace(/[a-z][A-Z]|[a-z]\d|\d[a-z]]/g, v => `${v[0]}${delimiter}${v[1]}`).replace(/[\s-_]/g, delimiter);
}

function splitByWord(string: string) {
  return delimiter(string, ' ').split(' ');
}

export type CaseType =
  | 'lower-case'
  | 'upper-case'
  | 'camel-case'
  | 'kebab-case'
  | 'pascal-case'
  | 'sentence-case'
  | 'snake-case'
  | 'start-case';

export class CaseRule extends BaseRuleWithValue<CaseType[]> {
  constructor(name: CommitPart, level: RuleConfigSeverity, applicable: RuleConfigCondition, value: CaseType | CaseType[]) {
    value = !Array.isArray(value) ? [value] : value;
    super(name, level, applicable, value);
  }

  validate(input: string): boolean {
    if (!input) return true;

    const hasCase = this.value.some(caseType => this.matchesCase(input, caseType));
    return this.applicable === 'always' ? hasCase : !hasCase;
  }

  fix(input: string): string | null {
    // Use the first case type if multiple are provided
    const [caseType] = this.value as [CaseType, ...CaseType[]];
    if (!input || this.applicable === 'never') return null;

    return this._fix(input, caseType);
  }

  private _fix(input: string, caseType: CaseType) {
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
        return splitByWord(input)
          .map(word => word.toLowerCase())
          .join('-');
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

  errorMessage(): string {
    const message = ['the', this.name, 'must', this.applicable, 'be in'];
    if (this.value.length === 1) {
      const caseStr = this.value[0] as CaseType;
      message.push(this._fix(caseStr, caseStr));
    } else {
      const [last, ...rest] = this.value as [CaseType, ...CaseType[]];

      // convert cases to their own representations for readability.
      const restStr = rest.map(v => this._fix(v, v)).join(', ');
      const lastStr = this._fix(last, last);

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
