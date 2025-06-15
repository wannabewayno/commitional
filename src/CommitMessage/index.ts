import CommitMessageFooter from './CommitMessageFooter.js';
import CommitMessageHeader from './CommitMessageHeader.js';

export interface CommitMessageHeaderOpts {
  type?: string;
  subject?: string;
  scope?: string | string[];
  scopeDelimiter?: string;
}

export interface CommitParts {
  type?: string;
  subject?: string;
  scope?: string | string[];
  scopeDelimiter?: string;
  body?: string;
  footer?: { token: string; text: string }[];
}
/**
 * Simple class for formatting and parsing commit messages
 */
export default class CommitMessage {
  private _breakingChangeMessage = '';
  private _isBreaking = false;
  private readonly footers: CommitMessageFooter[];

  constructor(
    private readonly _header: CommitMessageHeader,
    public body = '',
    ...footers: CommitMessageFooter[]
  ) {
    this.footers = footers;
  }

  get isBreaking() {
    return this._isBreaking;
  }

  breaking(message?: string) {
    this._isBreaking = true;
    this._header.breaking();

    // If the user has provided a message for why it's a breaking change...
    if (message) this._breakingChangeMessage = message;
    if (this._breakingChangeMessage) this.footer('BREAKING CHANGE', this._breakingChangeMessage);

    return this;
  }

  footer(token: string, message: string | null) {
    // find if the footer already exists
    const footerIdx = this.footers.findIndex(footer => footer.token === token);

    if (message) {
      const footer = this.footers[footerIdx];
      // If it doesn't exist, create one
      if (!footer) this.footers.push(new CommitMessageFooter(token, message));
      // otherwise update it's text content
      else footer.text = message;
    } else {
      // remove it
      this.footers.splice(footerIdx, 1);
    }

    return this;
  }

  get header() {
    return this._header.toString();
  }

  set subject(subject: string) {
    this._header.subject = subject;
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

  get addScope() {
    return this._header.addScope;
  }

  get delScope() {
    return this._header.delScope;
  }

  static fromParts({ type, scope, body, footer, subject }: CommitParts) {
    const header = new CommitMessageHeader({ type, scope, subject });
    const footers = footer ? footer.map(({ token, text }) => new CommitMessageFooter(token, text)) : [];
    return new CommitMessage(header, body, ...footers);
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
      footers.push(footer);
    }

    // The rest must be the body - join remaining lines
    const body = Array.from(contents.values()).reverse().join('\n\n');

    // Parse the header into type, scope, and subject
    const commit = new CommitMessage(header, body, ...footers);

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
*/
