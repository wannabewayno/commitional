import { BaseRuleWithValue } from './BaseRule.js';
import { NamespaceResolver } from '../../services/NamespaceResolver/index.js';
import type { GitContext } from '../GitContext.js';

export class NamespaceAlignmentRule extends BaseRuleWithValue<string[]> {
  override validate(inputs: string[], context?: GitContext): Record<number, string> | null {
    if (!context || context.files.length === 0) return null;

    const namespace = inputs[0] || '';
    const resolver = new NamespaceResolver(this.value);

    // Validate single namespace constraint
    const singleResult = resolver.validateSingleNamespace(context.files);
    if (!singleResult.valid) {
      return { 0: singleResult.errors[0] || 'Multiple namespaces detected' };
    }

    // Validate namespace alignment
    const alignResult = resolver.validateNamespaceAlignment(namespace, context.files);
    if (!alignResult.valid) {
      return { 0: alignResult.errors[0] || 'Namespace alignment failed' };
    }

    return null;
  }

  override fix(parts: string[], context?: GitContext): [Record<number, string> | null, string[]] {
    if (!context || !context.isStaged) {
      // Can't fix non-staged commits
      const errors = this.validate(parts, context);
      return [errors, parts];
    }

    // For now, return validation errors - actual unstaging would require git operations
    const errors = this.validate(parts, context);
    return [errors, parts];
  }

  override describe(): string {
    return 'Files must belong to the same namespace as specified in the commit message';
  }
}
