import type RulesEngine from '../../rules/index.js';

export class ScopeDeducer {
  private scopeDirectories: Set<string> = new Set();
  private wildcardDirectories: string[] = [];

  constructor(scopes: string[] = []) {
    if (scopes.length === 0) return;

    // Parse scope configuration
    for (const scope of scopes) {
      if (scope.endsWith('/*')) {
        // Wildcard directory - each subdirectory is a scope
        this.wildcardDirectories.push(scope.slice(0, -2));
      } else {
        // Direct scope - the directory name is the scope
        const scopeName = scope.replace(/\/$/, '');
        this.scopeDirectories.add(scopeName);
      }
    }
  }

  /**
   * Deduce the scope from a list of staged files
   * @param stagedFiles List of staged file paths
   * @returns The deduced scope or null if no scope can be deduced
   * @throws Error if files belong to multiple scopes
   */
  deduceScope(stagedFiles: string[]): string[] | null {
    if (stagedFiles.length === 0) return null;
    if (this.scopeDirectories.size === 0 && this.wildcardDirectories.length === 0) return null;

    const detectedScopes = new Set<string>();

    for (const file of stagedFiles) {
      const scope = this.getScopeForFile(file);
      if (scope !== null) detectedScopes.add(scope);
    }

    return detectedScopes.size > 0 ? Array.from(detectedScopes) : null;
  }

  private getScopeForFile(filePath: string): string | null {
    // Normalize path to use forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check direct scopes first
    for (const scopeName of this.scopeDirectories) {
      if (normalizedPath.startsWith(`${scopeName}/`)) return scopeName;
    }

    // Check wildcard directories
    for (const wildcardDir of this.wildcardDirectories) {
      normalizedPath.startsWith(`${wildcardDir}/`);
      if (normalizedPath.startsWith(`${wildcardDir}/`)) {
        const [scope] = normalizedPath.replace(`${wildcardDir}/`, '').split('/');
        return scope; // The scope is the subdirectory name under the wildcarded (parent) dir
      }
    }

    return null;
  }

  static fromRulesEngine(rulesEngine: RulesEngine) {
    const [scopeEnums] = rulesEngine.narrow('scope').getRulesOfType('enum');

    return new ScopeDeducer(scopeEnums.value);
  }
}
