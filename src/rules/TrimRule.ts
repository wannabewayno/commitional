import { BaseRule } from './BaseRule.js';

export class TrimRule extends BaseRule {
  get value() {
    return null;
  }
  
  validate(input: string): boolean {
    return input === input.trim();
  }

  fix(input: string): string | null {
    return input.trim();
  }

  errorMessage(): string {
    return 'not have leading or trailing whitespace';
  }
}
