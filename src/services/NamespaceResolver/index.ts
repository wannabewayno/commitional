import type RulesEngine from '../../RulesEngine/index.js';
import path from 'node:path';

export class NamespaceResolver {
  private namespaceDirectories: Set<string> = new Set();
  private wildcardDirectories: string[] = [];

  constructor(patterns: string[] = []) {
    if (patterns.length === 0) return;

    // Parse namespace configuration
    for (const pattern of patterns) {
      if (pattern.endsWith('/*')) {
        // Wildcard directory - each subdirectory is a namespace
        this.wildcardDirectories.push(pattern.slice(0, -2));
      } else {
        // Direct namespace - the directory name is the namespace
        const namespaceName = pattern.replace(/\/$/, '');
        this.namespaceDirectories.add(namespaceName);
      }
    }
  }

  /**
   * Resolve file paths to their corresponding namespaces
   */
  resolveFileNamespaces(files: string[]): string[] {
    if (files.length === 0) return [];
    if (this.namespaceDirectories.size === 0 && this.wildcardDirectories.length === 0) return [];

    const detectedNamespaces = new Set<string>();

    for (const file of files) {
      const namespace = this.getFileNamespace(file);
      if (namespace !== null) detectedNamespaces.add(namespace);
    }

    return Array.from(detectedNamespaces);
  }

  /**
   * Get the required namespace for a specific file
   */
  getFileNamespace(filePath: string): string | null {
    // Root files don't require namespace
    if (!filePath.includes('/')) return null;

    // Normalize path to use forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check direct namespaces first
    for (const namespaceName of this.namespaceDirectories) {
      if (normalizedPath.startsWith(`${namespaceName}/`)) {
        return path.basename(namespaceName);
      }
    }

    // Check wildcard directories
    for (const wildcardDir of this.wildcardDirectories) {
      if (normalizedPath.startsWith(`${wildcardDir}/`)) {
        const [namespace] = normalizedPath.replace(`${wildcardDir}/`, '').split('/');
        return namespace ?? null;
      }
    }

    return null;
  }

  /**
   * Validate that files only span a single namespace
   */
  validateSingleNamespace(files: string[]): { valid: boolean; namespaces: string[]; errors: string[] } {
    const namespaces = this.resolveFileNamespaces(files);
    const errors: string[] = [];

    if (namespaces.length > 1) {
      errors.push(`Commit spans multiple namespaces: ${namespaces.join(', ')}`);
      return { valid: false, namespaces, errors };
    }

    return { valid: true, namespaces, errors };
  }

  /**
   * Validate that commit namespace matches file namespaces
   */
  validateNamespaceAlignment(commitNamespace: string, files: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fileNamespaces = this.resolveFileNamespaces(files);

    // If no files require namespace, commit shouldn't have one
    if (fileNamespaces.length === 0 && commitNamespace) {
      const nonNamespacedFiles = files.filter(f => !f.includes('/'));
      if (nonNamespacedFiles.length > 0) {
        errors.push(`Files not apart of namespace "${commitNamespace}"`);
      }
      return { valid: false, errors };
    }

    // If files require namespace, commit must have matching namespace
    if (fileNamespaces.length === 1) {
      const requiredNamespace = fileNamespaces[0];
      if (!commitNamespace) {
        const exampleFile = files.find(f => this.getFileNamespace(f) === requiredNamespace);
        const folderPath = exampleFile ? path.dirname(exampleFile) : requiredNamespace;
        errors.push(`Files in ${folderPath} require namespace "${requiredNamespace}"`);
        return { valid: false, errors };
      }

      if (commitNamespace !== requiredNamespace) {
        const exampleFile = files.find(f => this.getFileNamespace(f) === requiredNamespace);
        const folderPath = exampleFile ? path.dirname(exampleFile) : requiredNamespace;
        errors.push(`Files in ${folderPath} require namespace "${requiredNamespace}", got "${commitNamespace}"`);
        return { valid: false, errors };
      }
    }

    return { valid: true, errors };
  }

  /**
   * Get available namespaces from patterns
   */
  getAvailableNamespaces(): string[] {
    const namespaces = new Set<string>();

    // Add direct namespaces
    for (const namespaceName of this.namespaceDirectories) {
      namespaces.add(path.basename(namespaceName));
    }

    return Array.from(namespaces);
  }

  // Backward compatibility method for ScopePrompt
  deduceScope(files: string[]): string[] | null {
    const namespaces = this.resolveFileNamespaces(files);
    return namespaces.length > 0 ? namespaces : null;
  }

  static fromRulesEngine(rulesEngine: RulesEngine) {
    const [namespaceEnums] = rulesEngine.narrow('namespace').getRulesOfType('enum');
    return new NamespaceResolver(namespaceEnums?.value);
  }
}

// Keep ScopeDeducer as alias for backward compatibility
export const ScopeDeducer = NamespaceResolver;
