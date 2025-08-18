Migration Plan: BaseRule Interface Update
Overview
Update all rules and tests to use the new Record<number, string> error mapping approach with combined validate/fix methods.

Phase 1: Rule Implementation Updates
A. Method Signature Changes
// Before
validate(parts: string[]): (string | null)[]
fix(parts: string[]): string[]

// After  
validate(parts: string[]): null | Record<number, string>
fix(parts: string[]): [errors: null | Record<number, string>, fixed: string[]]

Copy
B. Implementation Patterns
Pattern 1: Per-Element Rules (EmptyRule, CaseRule, MaxLengthRule, etc.)

validate(parts: string[]): null | Record<number, string> {
  const errors: Record<number, string> = {};
  
  parts.forEach((part, index) => {
    if (!this.validatePart(part)) {
      errors[index] = this.getErrorMessage();
    }
  });
  
  return Object.keys(errors).length > 0 ? errors : null;
}

fix(parts: string[]): [null | Record<number, string>, string[]] {
  const fixed = parts.map(part => this.fixPart(part));
  const errors = this.validate(fixed);
  return [errors, fixed];
}

Copy
typescript
Pattern 2: Whole-Array Rules (ExistsRule, AllowMultipleRule)

validate(parts: string[]): null | Record<number, string> {
  if (this.validateWholeArray(parts)) return null;
  
  // Return error on first element for array-level issues
  return { 0: this.getErrorMessage() };
}

fix(parts: string[]): [null | Record<number, string>, string[]] {
  const fixed = this.fixWholeArray(parts);
  const errors = this.validate(fixed);
  return [errors, fixed];
}

Copy
typescript
Phase 2: Test Updates
A. Test Assertion Changes
// Before
const results = rule.validate(['test']);
assert.deepStrictEqual(results, [null]);

// After
const result = rule.validate(['test']);
assert.strictEqual(result, null);

// Before (with errors)
const results = rule.validate(['invalid']);
assert.strictEqual(results[0], 'error message');

// After (with errors)
const result = rule.validate(['invalid']);
assert.deepStrictEqual(result, { 0: 'error message' });

Copy
B. Fix Method Tests
// Before
const fixed = rule.fix(['test']);
assert.deepStrictEqual(fixed, ['fixed']);

// After
const [errors, fixed] = rule.fix(['test']);
assert.strictEqual(errors, null);
assert.deepStrictEqual(fixed, ['fixed']);

Copy
typescript
C. Check Method Tests
// Before
const results = rule.check(['test']);
assert.deepStrictEqual(results, [null]);

// After
const [output, errors, warnings] = rule.check(['test']);
assert.deepStrictEqual(output, ['test']);
assert.strictEqual(errors, null);
assert.strictEqual(warnings, null);

Copy
typescript
Phase 3: Implementation Order
Priority 1: Simple Rules (establish patterns)
EmptyRule - Basic per-element validation

TrimRule - Simple fixing logic

MaxLengthRule - Truncation fixing

Priority 2: Complex Rules (apply patterns)
CaseRule - Multiple case types

EnumRule - Value validation

MinLengthRule - Non-fixable validation

Priority 3: Array-Level Rules (special cases)
ExistsRule - Whole-array validation with complex fixing

AllowMultipleRule - Array length constraints

Priority 4: Specialized Rules
FullStopRule - String manipulation

ExclamationMarkRule - Pattern matching

LeadingBlankRule - Line-based validation

MaxLineLengthRule - Multi-line processing

Phase 4: Missing Components
A. ValidationErrors Class
Need to implement the ValidationErrors class referenced in RulesEngine:

class ValidationErrors {
  constructor(public prefix?: string) {}
  update(errors: Record<number, string>): void
  list(): string[]
}

Copy
typescript
B. Error Message Helpers
Since errorMessage() is removed, each rule needs internal error message generation:

private getErrorMessage(): string {
  return `the ${this.scope} must ${this.applicable} meet criteria`;
}

Copy
typescript
Migration Strategy
Approach 1: Incremental (Recommended)
Update one rule at a time

Update corresponding tests immediately

Verify compilation after each rule

Easier to debug issues

Approach 2: Batch
Update all rules first

Update all tests second

Faster but harder to debug

Questions for Discussion
Error Message Strategy: Should we create a base getErrorMessage() method in BaseRule, or keep it rule-specific?

ValidationErrors Implementation: Do you have the ValidationErrors class implemented, or should we create it?

Test Coverage: Should we add new tests for the Record<number, string> error mapping, or just update existing ones?

Migration Order: Prefer incremental (safer) or batch (faster) approach?

Backward Compatibility: Any need to maintain old interfaces during transition?

Ready to proceed? Which approach and starting point would you prefer?

> ValidationErrors Implementation: Do you have the ValidationErrors class implemented, or should we create it?

ValidationErrors already exists at the top of rules/index.ts so no need to implement that, I've done that already.> Error Message Strategy: Should we create a base getErrorMessage() method in BaseRule, or keep it rule-specific?Rule specific please!

> Test Coverage: Should we add new tests for the Record<number, string> error mapping, or just update existing ones?

Update existing ones, we have enough coverage

> Migration Order: Prefer incremental (safer) or batch (faster) approach

Incremental please.

> Backward Compatibility: Any need to maintain old interfaces during transition?

No, nothing here is public or SDK facing,


Context
Perfect! Let's proceed with the incremental migration plan.

Migration Plan: Confirmed Approach
✅ Confirmed Details
ValidationErrors: Already exists, no implementation needed

Error Messages: Rule-specific methods

Test Coverage: Update existing tests only

Migration: Incremental (one rule at a time)

Compatibility: No backward compatibility needed

Phase 1: Start with EmptyRule
Let's begin with EmptyRule as it's the simplest pattern. Here's what we'll update:

EmptyRule Implementation
validate(parts: string[]): null | Record<number, string> {
  const errors: Record<number, string> = {};
  
  parts.forEach((part, index) => {
    const isEmpty = part.trim() === '';
    const isValid = this.applicable === 'always' ? isEmpty : !isEmpty;
    
    if (!isValid) {
      errors[index] = `the ${this.scope} must ${this.applicable} be empty`;
    }
  });
  
  return Object.keys(errors).length > 0 ? errors : null;
}

fix(parts: string[]): [null | Record<number, string>, string[]] {
  const fixed = this.applicable === 'always' 
    ? parts.map(() => '') 
    : parts; // Can't fix 'never' case
    
  const errors = this.validate(fixed);
  return [errors, fixed];
}

Copy
typescript
EmptyRule Test Updates
Change rule.validate(['']) assertions from [null] to null

Change error assertions from results[0] to result[0]

Update fix() tests to destructure [errors, fixed]

Update check() tests to destructure [output, errors, warnings]

Ready to Start?
Should I proceed with updating EmptyRule first? This will establish the pattern for all other per-element rules (TrimRule, MaxLengthRule, CaseRule, etc.).

Once EmptyRule is working, we can quickly apply the same pattern to the other simple rules, then tackle the more complex array-level rules like ExistsRule.

Proceed with EmptyRule migration? 🚀

I prefer you to update Empty rule to be in line with the following approach.

import { BaseRule } from './BaseRule.js';

export class EmptyRule extends BaseRule {
  validate(parts: string[]): null | Record<number, string> {
    const errs = Object.fromEntries(parts.map((part,idx) => [idx, part && this.errorMessage()]).filter(Boolean));
    return Object.keys(errs).length ? errs : null
  }

  private validateEmpty(input: string): boolean {
    const isEmpty = input.trim() === '';
    return this.applicable === 'always' ? isEmpty : !isEmpty;
  }

  fix(parts: string[]): [null | Record<number, string>, string[]] {
    // If applicable is 'always', we can fix by setting empty strings
    if (this.applicable === 'always') return [null, parts.map(() => '')]

    // Can't fix if applicable is 'never' and input is empty - return original
    errs = Object.fromEntries(parts.map((part,idx) => [idx, part && this.errorMessage()])filter(Boolean))
    return [Object.keys(errs).length ? errs : null, parts];
  }

  errorMessage(): string {
    return `the ${this.scope} must ${this.applicable} be empty`;
  }
}