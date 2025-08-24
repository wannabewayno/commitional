import CommitMessageHeader from './CommitMessageHeader.js';
import { expect } from 'chai';

describe('CommitMessageHeader - Namespace Support', () => {
  describe('constructor', () => {
    it('should create header with namespace', () => {
      const header = new CommitMessageHeader({
        type: 'feat',
        namespace: 'myapp',
        subject: 'add feature',
      });

      expect(header.type).to.equal('feat');
      expect(header.namespace).to.equal('myapp');
      expect(header.subject).to.equal('add feature');
    });

    it('should create header with namespace and scope', () => {
      const header = new CommitMessageHeader({
        type: 'feat',
        namespace: 'myapp',
        scope: 'auth',
        subject: 'add login',
      });

      expect(header.type).to.equal('feat');
      expect(header.namespace).to.equal('myapp');
      expect(header.scope).to.equal('auth');
      expect(header.subject).to.equal('add login');
    });

    it('should create header without namespace', () => {
      const header = new CommitMessageHeader({
        type: 'feat',
        scope: 'auth',
        subject: 'add feature',
      });

      expect(header.namespace).to.equal('');
      expect(header.scope).to.equal('auth');
    });
  });

  describe('namespace getter/setter', () => {
    it('should set and get namespace', () => {
      const header = new CommitMessageHeader();
      header.namespace = 'myapp';
      expect(header.namespace).to.equal('myapp');
    });

    it('should trim namespace when setting', () => {
      const header = new CommitMessageHeader();
      header.namespace = '  myapp  ';
      expect(header.namespace).to.equal('myapp');
    });
  });

  describe('toString', () => {
    it('should format namespace only', () => {
      const header = new CommitMessageHeader({
        type: 'feat',
        namespace: 'myapp',
        subject: 'add feature',
      });

      expect(header.toString()).to.equal('feat(myapp): add feature');
    });

    it('should format namespace with scope', () => {
      const header = new CommitMessageHeader({
        type: 'feat',
        namespace: 'myapp',
        scope: 'auth',
        subject: 'add login',
      });

      expect(header.toString()).to.equal('feat(myapp>auth): add login');
    });

    it('should format namespace with nested scope', () => {
      const header = new CommitMessageHeader({
        type: 'feat',
        namespace: 'myapp',
        scope: 'auth>session',
        subject: 'add session management',
      });

      expect(header.toString()).to.equal('feat(myapp>auth>session): add session management');
    });

    it('should format traditional scope without namespace', () => {
      const header = new CommitMessageHeader({
        type: 'feat',
        scope: 'auth',
        subject: 'add feature',
      });

      expect(header.toString()).to.equal('feat(auth): add feature');
    });

    it('should format without scope or namespace', () => {
      const header = new CommitMessageHeader({
        type: 'feat',
        subject: 'add feature',
      });

      expect(header.toString()).to.equal('feat: add feature');
    });
  });

  describe('fromString', () => {
    it('should parse namespace only format with explicit separator', () => {
      const header = CommitMessageHeader.fromString('feat(myapp>): add feature');

      expect(header.type).to.equal('feat');
      expect(header.namespace).to.equal('myapp');
      expect(header.scope).to.equal('');
      expect(header.subject).to.equal('add feature');
    });

    it('should treat single value as scope for backward compatibility', () => {
      const header = CommitMessageHeader.fromString('feat(myapp): add feature');

      expect(header.type).to.equal('feat');
      expect(header.namespace).to.equal('');
      expect(header.scope).to.equal('myapp');
      expect(header.subject).to.equal('add feature');
    });

    it('should parse namespace with scope format', () => {
      const header = CommitMessageHeader.fromString('feat(myapp>auth): add login');

      expect(header.type).to.equal('feat');
      expect(header.namespace).to.equal('myapp');
      expect(header.scope).to.equal('auth');
      expect(header.subject).to.equal('add login');
    });

    it('should parse namespace with nested scope format', () => {
      const header = CommitMessageHeader.fromString('feat(myapp>auth>session): add session management');

      expect(header.type).to.equal('feat');
      expect(header.namespace).to.equal('myapp');
      expect(header.scope).to.equal('auth>session');
      expect(header.subject).to.equal('add session management');
    });

    it('should parse traditional scope format', () => {
      const header = CommitMessageHeader.fromString('feat(auth): add feature');

      expect(header.type).to.equal('feat');
      expect(header.namespace).to.equal('');
      expect(header.scope).to.equal('auth');
      expect(header.subject).to.equal('add feature');
    });

    it('should parse format without scope or namespace', () => {
      const header = CommitMessageHeader.fromString('feat: add feature');

      expect(header.type).to.equal('feat');
      expect(header.namespace).to.equal('');
      expect(header.scope).to.equal('');
      expect(header.subject).to.equal('add feature');
    });

    it('should handle empty namespace in namespace>scope format', () => {
      const header = CommitMessageHeader.fromString('feat(>auth): add feature');

      expect(header.type).to.equal('feat');
      expect(header.namespace).to.equal('');
      expect(header.scope).to.equal('auth');
      expect(header.subject).to.equal('add feature');
    });
  });

  describe('clone', () => {
    it('should clone header with namespace', () => {
      const original = new CommitMessageHeader({
        type: 'feat',
        namespace: 'myapp',
        scope: 'auth',
        subject: 'add feature',
      });

      const cloned = original.clone();

      expect(cloned.type).to.equal('feat');
      expect(cloned.namespace).to.equal('myapp');
      expect(cloned.scope).to.equal('auth');
      expect(cloned.subject).to.equal('add feature');
      expect(cloned).not.to.equal(original);
    });
  });

  describe('style methods', () => {
    it('should set style for namespace', () => {
      const header = new CommitMessageHeader({
        namespace: 'myapp',
      });

      const styleFn = (text: string) => `styled-${text}`;
      header.setStyle(styleFn, 'namespace');

      // Style should be applied when accessed
      expect(header.namespace).to.include('myapp');
    });

    it('should style namespace', () => {
      const header = new CommitMessageHeader({
        namespace: 'myapp',
      });

      const result = header.style('namespace');
      expect(result).to.equal(header);
    });

    it('should unstyle namespace', () => {
      const header = new CommitMessageHeader({
        namespace: 'myapp',
      });

      const result = header.unstyle('namespace');
      expect(result).to.equal(header);
    });
  });
});
