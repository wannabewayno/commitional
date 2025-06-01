import { BaseRuleWithValue } from './BaseRule.js';

export type CaseType =
  | 'lower-case'
  | 'upper-case'
  | 'camel-case'
  | 'kebab-case'
  | 'pascal-case'
  | 'sentence-case'
  | 'snake-case'
  | 'start-case';

export class CaseRule extends BaseRuleWithValue<CaseType | CaseType[]> {
  validate(input: string): boolean {
    if (!input) return true;

    const caseTypes = Array.isArray(this.value) ? this.value : [this.value];
    return caseTypes.some(caseType => this.matchesCase(input, caseType));
  }

  fix(input: string): string | null {
    if (!input || this.applicable === 'never') return null;

    // Use the first case type if multiple are provided
    const caseType = Array.isArray(this.value) ? this.value[0] : this.value;

    switch (caseType) {
      case 'lower-case':
        return input.toLowerCase();
      case 'upper-case':
        return input.toUpperCase();
      case 'sentence-case':
        return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
      case 'start-case':
        return input
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      // More complex cases are harder to fix automatically
      default:
        return null;
    }
  }

  errorMessage(): string {
    const caseDescription = Array.isArray(this.value) ? `one of [${this.value.join(', ')}]` : this.value;

    return `be in ${caseDescription} format`;
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
        return input.split(' ').every(word => word && word[0] === word[0].toUpperCase());
      default:
        return false;
    }
  }
}
