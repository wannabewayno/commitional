import type { CommitPart } from '../RulesEngine/index.js';
import Text, { type StyleFn } from './Text.js';

export interface CommitMessageHeaderOpts {
  type?: string;
  subject?: string;
  scope?: string | string[];
  scopeDelimiter?: string;
}

// Type, scope and subject are all optional. validation is not the purpose of this class
export default class CommitMessageHeader {
  private _type: Text;
  private _scopeText: Text = new Text();
  private readonly _scope: string[] = [];
  private _subject: Text;
  private scopeDelimiter: string;
  private separator = ': ';
  private breakingEmoji = '⚠️';

  constructor(opts: CommitMessageHeaderOpts) {
    this._type = new Text(opts.type ?? '');
    this._subject = new Text(opts.subject ?? '');
    this.scopeDelimiter = opts.scopeDelimiter ?? ',';
    this.addScope(...(Array.isArray(opts.scope) ? opts.scope : opts.scope ? opts.scope.split(this.scopeDelimiter) : []));
  }

  set type(value: string) {
    this._type.value = value.trim();
  }

  get type() {
    return this._type.toString();
  }

  set subject(value: string) {
    this._subject.value = value.trim();
  }

  get subject() {
    return this._subject.toString();
  }

  setStyle(style: StyleFn, commitPart?: Extract<CommitPart, 'type' | 'subject' | 'scope'>) {
    switch (commitPart) {
      case 'type':
        this._type.setStyle(style);
        break;
      case 'scope':
        this._scopeText.setStyle(style);
        break;
      case 'subject':
        this._subject.setStyle(style);
        break;
    }
    return this;
  }

  style(commitPart?: CommitPart) {
    switch (commitPart) {
      case 'type':
        this._type.style();
        break;
      case 'scope':
        this._scopeText.style();
        break;
      case 'subject':
        this._subject.style();
        break;
    }
    return this;
  }

  unstyle(commitPart?: CommitPart) {
    switch (commitPart) {
      case 'type':
        this._type.unstyle();
        break;
      case 'scope':
        this._scopeText.unstyle();
        break;
      case 'subject':
        this._subject.unstyle();
        break;
    }
    return this;
  }

  addScope(...scopes: string[]) {
    scopes.forEach(scope => {
      const trimmed = scope.trim();
      if (!trimmed) return;
      if (this._scope.some(text => text === scope)) return;
      this._scope.push(trimmed);
      this._scopeText = new Text(this._scope.join(this.scopeDelimiter));
    });

    return this;
  }

  set scope(scope: string) {
    this._scope.length = 0;
    this._scopeText.value = '';
    const scopes = scope.split(this.scopeDelimiter);
    this.addScope(...scopes);
  }

  get scope(): string {
    return this._scopeText.toString();
  }

  delScope(scope: string) {
    const index = this._scope.findIndex(text => text === scope);
    if (index === -1) return this;
    this._scope.splice(index, 1);
    return this;
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
      if (this._subject?.endsWith(this.breakingEmoji)) this.subject = this._subject.replace(this.breakingEmoji, '');
      else this.subject = `${this._subject ?? ''} ${this.breakingEmoji}`;
    }

    return this;
  }

  toString(): string {
    const subject = this.subject;
    const scope = this.scope;
    const type = this.type;
    const header: string[] = [];
    if (subject) header.unshift(this.subject);
    if (scope || type) {
      header.unshift(this.separator);
      if (scope) header.unshift(`(${scope})`);
      if (type) header.unshift(type);
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
