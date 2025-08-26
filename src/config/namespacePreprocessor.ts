import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { CommitlintConfig } from './index.js';

/**
 * Check if pattern should be expanded (ends with / or /*)
 */
function shouldExpand(pattern: string): boolean {
  return pattern.endsWith('/') || pattern.endsWith('/*');
}

/**
 * Expand glob pattern to actual directories
 */
function expandPattern(pattern: string): string[] {
  try {
    const baseDir = pattern.replace(/\/\*?$/, '');
    const entries = readdirSync(baseDir, { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).map(entry => `${baseDir}/${entry.name}/`);
  } catch (error) {
    // Silently return empty array if directory doesn't exist
    // This allows configs to work in environments where directories haven't been created yet
    return [];
  }
}

/**
 * Extract namespace name from path (basename without trailing slash)
 */
function getNamespaceFromPath(pathStr: string): string {
  return path.basename(pathStr.replace(/\/$/, ''));
}

interface ObjectThatHasRules {
  rules: CommitlintConfig['rules'];
}

/**
 * Preprocess namespace configuration to expand patterns and create symbiotic rules
 */
export function preprocessNamespaceConfig(config: ObjectThatHasRules): void {
  if (!config.rules) return;

  const namespaceEnum = config.rules['namespace-enum'];
  if (!namespaceEnum || !Array.isArray(namespaceEnum) || namespaceEnum.length < 3) return;

  const [level, condition, patterns] = namespaceEnum;
  if (!Array.isArray(patterns)) return;

  // Separate expandable and static patterns
  const expandablePatterns = patterns.filter(shouldExpand);
  const staticPatterns = patterns.filter(p => !shouldExpand(p));

  // Expand patterns to actual directories
  const expandedPaths = expandablePatterns.flatMap(expandPattern);
  const allPaths = [...expandedPaths, ...staticPatterns];

  // Extract namespace names from paths
  const namespaceNames = allPaths.map(getNamespaceFromPath).filter(Boolean);

  // Only update if we have resolved namespaces, otherwise keep original patterns
  if (namespaceNames.length > 0) {
    config.rules['namespace-enum'] = [level, condition, namespaceNames];
    config.rules['namespace-alignment'] = [2, 'always', allPaths];
  }
}
