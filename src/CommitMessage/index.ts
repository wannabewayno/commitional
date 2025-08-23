import fallbackOnErr from '../lib/fallbackOnError.js';
import filterMap from '../lib/filterMap.js';
import type RulesEngine from '../RulesEngine/index.js';
import CommitMessageFooter from './CommitMessageFooter.js';
import CommitMessageHeader from './CommitMessageHeader.js';
import Text, { type StyleFn } from './Text.js';

export type CommitPart = 'type' | 'subject' | 'scope' | 'body' | 'footers';

export interface CommitMessageHeaderOpts {
  type?: string;
  subject?: string;
  scope?: string | string[];
  scopeDelimiter?: string;
}

export interface CommitJSON {
  type?: string;
  subject?: string;
  scope?: string | string[];
  scopeDelimiter?: string;
  body?: string;
  footers?: string[];
}

export interface CommitMessageOpts {
  header?: CommitMessageHeader;
  body?: string;
  footers?: CommitMessageFooter[];
}

/**
 * Simple class for formatting and parsing commit messages
 */
export default class CommitMessage {
  private readonly _header: CommitMessageHeader;
  private _breakingChangeMessage = '';
  private _isBreaking = false;
  private _body: Text = new Text();
  private _footers: CommitMessageFooter[];

  constructor({ header, body = '', footers = [] }: CommitMessageOpts = {}) {
    this._header = header ?? new CommitMessageHeader();
    this.body = body;
    this._footers = footers;
  }

  get body() {
    return this._body.toString();
  }

  set body(body: string) {
    this._body.value = body.trim();
  }

  get isBreaking() {
    return this._isBreaking;
  }

  breaking(message?: string) {
    if (this._isBreaking) {
      this._isBreaking = false;
      this._header.breaking();

      // [2]
      this.footer('BREAKING CHANGE', null);
      this.footer('BREAKING-CHANGE', null);
    } else {
      this._isBreaking = true;
      this._header.breaking();

      // If the user has provided a message for why it's a breaking change...
      if (message) this._breakingChangeMessage = message;
      if (this._breakingChangeMessage) this.footer('BREAKING CHANGE', this._breakingChangeMessage); // [1]
    }
    return this;
  }

  /**
   * One size fits all CRUD function for footers
   * If provided with two arguments, will either create or edit a footer with the provided message
   * If message is null, will remove the footer
   * If provided with no second argument, acts as a getter for that footer.
   * @param token
   * @param message
   * @returns
   */
  footer(token: string, message?: string | null) {
    // find if the footer already exists
    const footerIdx = this._footers.findIndex(footer => footer.token === token);

    if (typeof message === 'string') {
      // If it doesn't exist, create one
      const footer = this._footers[footerIdx] ?? new CommitMessageFooter(token, message);
      if (footerIdx === -1) this._footers.push(footer);
      // otherwise update it's text content
      else footer.text = message;

      return footer;
    }
    if (message === null) {
      // remove it
      const [removed] = this._footers.splice(footerIdx, 1);
      return removed;
    }

    return this._footers.find(footer => footer.token === token);
  }

  setStyle(style: StyleFn, commitPart?: CommitPart) {
    switch (commitPart) {
      case 'body':
        this._body.setStyle(style);
        break;
      case 'footers':
        this._footers.map(v => v.setStyle(style));
        break;
      case 'type':
      case 'scope':
      case 'subject':
        this._header.setStyle(style, commitPart);
        break;
      default:
        // Set all styles
        (['body', 'footers', 'type', 'scope', 'subject'] as const).forEach(part => this.setStyle(style, part));
    }
  }

  style(commitPart?: CommitPart, filter?: string) {
    switch (commitPart) {
      case 'body':
        this._body.style();
        break;
      case 'footers':
        if (filter) {
          const footer = this.footer(filter);
          if (footer) footer.style();
        } else this._footers.map(v => v.style());
        break;
      case 'type':
      case 'scope':
      case 'subject':
        this._header.style(commitPart);
        break;
      default:
        // Set all styles
        (['body', 'footers', 'type', 'scope', 'subject'] as const).forEach(part => this.style(part));
    }
    return this;
  }

  unstyle(commitPart?: CommitPart, filter?: string) {
    switch (commitPart) {
      case 'body':
        this._body.unstyle();
        break;
      case 'footers':
        if (filter) {
          const footer = this.footer(filter);
          if (footer) footer.unstyle();
        } else this._footers.map(v => v.unstyle());
        break;
      case 'type':
      case 'scope':
      case 'subject':
        this._header.unstyle(commitPart);
        break;
      default:
        // unstyle all
        (['body', 'footers', 'type', 'scope', 'subject'] as const).forEach(part => this.unstyle(part));
    }

    return this;
  }

  get trailers() {
    return this._footers.map(v => v.token);
  }

  get footers() {
    return this._footers.map(v => v.toString());
  }

  set footers(footers: string[]) {
    this._footers = footers.reduce((valid, v) => {
      const footer = CommitMessageFooter.fromString(v);
      if (footer instanceof CommitMessageFooter) valid.push(footer);
      return valid;
    }, [] as CommitMessageFooter[]);
  }

  get header() {
    return this._header.toString();
  }

  set subject(subject: string) {
    this._header.subject = subject;
  }

  get subject() {
    return this._header.subject;
  }

  get type() {
    return this._header.type;
  }

  set type(type: string) {
    this._header.type = type;
  }

  set scope(scope: string) {
    this._header.scope = scope;
  }

  get scope() {
    return this._header.scope;
  }

  get scopes() {
    return this._header.scopes;
  }

  set scopes(scopes: string[]) {
    this.scope = '';
    this.addScope(...scopes);
  }

  addScope(...scopes: string[]) {
    return this._header.addScope(...scopes);
  }

  delScope(scope: string) {
    return this._header.delScope(scope);
  }

  toJSON(): CommitJSON {
    return {
      type: this.type,
      scope: this.scope,
      subject: this.subject,
      body: this.body,
      footers: this.footers.map(v => v.toString()),
    };
  }

  clone(): CommitMessage {
    return new CommitMessage({
      header: this._header.clone(),
      body: this._body.value,
      footers: this._footers.map(v => v.clone()),
    });
  }

  /**
   * Process the current commit message with a rules engine and return a new commit message with
   * any errors or warning captured during the process will be collected.
   * @param rulesEngine
   * @returns A tuple of the [processed commit, if it's valid according to all rules, info object of field names and any errors and warnings]
   */
  process(
    rulesEngine: RulesEngine,
    behaviour: 'validate' | 'fix' = 'fix',
  ): [processedCommit: CommitMessage, valid: boolean, info: string[]] {
    // Create a clone of the commit to leave original untouched when behaviour is set to 'fix'
    const commit = this.clone();

    const [errors, warnings] = rulesEngine.validate(commit, behaviour);

    // Construct an error message for the whole commit.
    return [commit, !errors.length, errors.concat(warnings)];
  }

  static fromJSON({ type, scope, body, footers = [], subject }: CommitJSON) {
    const header = new CommitMessageHeader({ type, scope, subject });

    return new CommitMessage({
      header,
      body,
      footers: filterMap(footers, footer => fallbackOnErr(CommitMessageFooter.fromString(footer), undefined)),
    });
  }

  static fromString(message: string): CommitMessage {
    // Split message into lines
    const paragraphs = message.split('\n\n');

    // Parse header from first line
    const [headerText, ...rest] = paragraphs;

    // biome-ignore lint/style/noNonNullAssertion: the first entry of split will always exist, even if it's an empty string. this will literally always exist
    const header = CommitMessageHeader.fromString(headerText!);

    // Create a content-map that maps the index to the content in reverse order
    // i.e footers first (if any) and then the body copy
    const contents = new Map(rest.reverse().map((content, index) => [index, content]));

    // Create placeholder to capture any footers we find in the message
    const footers: CommitMessageFooter[] = [];

    // We iterate backwards from the footers and attempt to parse each block into a footer.
    for (const [key, paragraph] of contents.entries()) {
      const footer = CommitMessageFooter.fromString(paragraph);

      // The first sign of an error must be the start of the body copy, this is our break condition
      if (footer instanceof Error) break;

      // remove footer from out content map
      // When this process is done only the body copy will remain.
      contents.delete(key);

      // Collect our footer
      footers.unshift(footer);
    }

    // The rest must be the body - join remaining lines
    const body = Array.from(contents.values()).reverse().join('\n\n');

    // Parse the header into type, scope, and subject
    const commit = new CommitMessage({ header, body, footers });

    return commit;
  }

  toString() {
    const commitMsg: [header: string, body?: string, ...footers: string[]] = [this.header];
    if (this.body) commitMsg.push(this.body);
    if (this.footers.length) commitMsg.push(...this.footers.map(v => v.toString()));

    return commitMsg.join('\n\n');
  }
}

/*
  References:
  [1] 'BREAKING CHANGE' in footer: Conventional Commits v1.0.0 > Specification > rule 12; Available: https://www.conventionalcommits.org/en/v1.0.0/
  [2] 'BREAKING CHANGE' must be synonymous with 'BREAKING-CHANGE': Conventional Commits v1.0.0 > Specification > rule 16; Available: https://www.conventionalcommits.org/en/v1.0.0/
*/
