export interface CommitMessageHeaderOpts {
  type?: string;
  subject?: string;
  scope?: string | string[];
  scopeDelimiter?: string;
}

// Type, scope and subject are all optional. validation is not the purpose of this class
export default class CommitMessageHeader {
  private _type: string;
  private readonly _scope: Set<string>;
  private _subject: string;
  private scopeDelimiter: string;
  private separator = ': ';
  private breakingEmoji = '⚠️';

  constructor(opts: CommitMessageHeaderOpts) {
    this._type = opts.type ?? '';
    this._subject = opts.subject ?? '';
    this.scopeDelimiter = opts.scopeDelimiter ?? ',';
    this._scope = Array.isArray(opts.scope)
      ? new Set(opts.scope)
      : opts.scope !== undefined
        ? new Set(opts.scope.split(this.scopeDelimiter))
        : new Set();
  }

  set type(value: string) {
    this._type = value.trim();
  }

  get type() {
    return this._type;
  }

  set subject(value: string) {
    this._subject = value.trim();
  }

  get subject() {
    return this._subject;
  }

  addScope(scope: string) {
    const trimmed = scope.trim();
    this._scope.add(trimmed);
  }

  set scope(scope: string) {
    this._scope.clear();
    const scopes = scope.split(this.scopeDelimiter);
    scopes.forEach(scope => this.addScope(scope));
  }

  get scope(): string {
    return [...this.scope].join(this.scopeDelimiter);
  }

  delScope(scope: string) {
    this._scope.delete(scope);
  }

  /**
   * Toggle breaking change formatting ⚠️
   */
  breaking() {
    // Breaking changes MUST be indicated in the type/scope prefix of a commit, or as an entry in the footer. [1]
    if (this.separator.startsWith('!')) this.separator = this.separator.slice(1);
    else this.separator = `!${this.separator}`;

    // If the user has set a breaking change emoji toggle this. (this is personal preference from the package author)
    if (this.breakingEmoji) {
      if (this._subject?.endsWith('⚠️')) this._subject = this._subject.slice(0, -2);
      else this._subject = `${this._subject ?? ''} ⚠️`;
    }
  }

  toString(): string {
    const header: string[] = [];
    if (this._subject) header.unshift(this._subject);
    if (this._scope.size || this._type) {
      header.unshift(this.separator);
      if (this._scope.size) header.unshift(`(${[...this._scope].join(this.scopeDelimiter)})`);
      if (this._type) header.unshift(this._type);
    }

    return header.join('');
  }

  valueOf(): string {
    return this.toString();
  }

  static fromString(header: string) {
    // Extract the type and or scope. the rest must be the subject
    const match = header.match(/^(?<type>\w+)?(?:\((?<scope>.*?)\))?: ?(?<subject>.*)$/);

    if (!match || !match.groups) return new CommitMessageHeader({ subject: header });

    const { type, scope, subject } = match.groups;
    return new CommitMessageHeader({ type, scope, subject });
  }
}

/*
  References:
  [1] Indicating a breaking change: Conventional Commits v1.0.0 > Specification > rule 11; Available: https://www.conventionalcommits.org/en/v1.0.0/
*/
