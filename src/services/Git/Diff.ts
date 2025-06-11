/**
 * Represents a collection of file diffs
 */
export default class Diff {
  /**
   * Create a new Diff instance
   * @param diffs Record of file paths to diff content
   */
  constructor(private readonly diffs: Record<string, string> = {}) {}

  /**
   * Get all file paths in this diff
   */
  get files(): string[] {
    return Object.keys(this.diffs);
  }

  /**
   * Get the diff for a specific file
   * @param file File path
   * @returns Diff content or undefined if file not found
   */
  file(file: string): string | undefined {
    return this.diffs[file];
  }

  /**
   * Add a new file diff
   * @param file File path
   * @param diff Diff content
   * @returns This diff instance for chaining
   */
  add(file: string, diff: string): this {
    this.diffs[file] = diff;
    return this;
  }

  /**
   * Merge with another diff
   * @param diff Another diff instance
   * @returns A new diff containing both diffs
   */
  merge(diff: Diff): Diff {
    return new Diff({
      ...this.diffs,
      ...diff.diffs,
    });
  }

  /**
   * Convert to string representation
   * @returns All diffs concatenated
   */
  toString(): string {
    return Object.values(this.diffs).join('\n');
  }
}
