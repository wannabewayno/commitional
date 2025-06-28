import CommitMessage from './index.js';
import CommitMessageHeader from './CommitMessageHeader.js';
import CommitMessageFooter from './CommitMessageFooter.js';
import { expect } from 'chai';
import sinon from 'sinon';

describe('CommitMessage', () => {
  let header: CommitMessageHeader;
  let footer: CommitMessageFooter;

  beforeEach(() => {
    header = new CommitMessageHeader({ type: 'feat', scope: 'auth', subject: 'I am the subject' });
    footer = new CommitMessageFooter('token', 'message');
  });

  describe('constructor', () => {
    it('should create a commit message with header only', () => {
      const commit = new CommitMessage(header);
      expect(commit).to.be.instanceOf(CommitMessage);
    });

    it('should create a commit message with header and body', () => {
      const commit = new CommitMessage(header, 'Test body');
      expect(commit.body).to.equal('Test body');
    });

    it('should create a commit message with header, body, and footers', () => {
      const commit = new CommitMessage(header, 'Test body', footer);
      expect(commit.body).to.equal('Test body');
    });
  });

  describe('body getter/setter', () => {
    it('should set and get body', () => {
      const commit = new CommitMessage(header);
      commit.body = 'Test body content';
      expect(commit.body).to.equal('Test body content');
    });

    it('should trim body content when setting', () => {
      const commit = new CommitMessage(header);
      commit.body = '  Test body with spaces  ';
      expect(commit.body).to.equal('Test body with spaces');
    });

    it('should handle empty body', () => {
      const commit = new CommitMessage(header);
      commit.body = '';
      expect(commit.body).to.equal('');
    });
  });

  describe('breaking change functionality', () => {
    it('should mark commit as breaking', () => {
      const commit = new CommitMessage(header);
      commit.breaking();
      expect(commit.isBreaking).to.be.true;
    });

    it('should call breaking on header when marked as breaking', () => {
      const breakingSpy = sinon.spy(header, 'breaking');

      const commit = new CommitMessage(header);
      commit.breaking();
      expect(breakingSpy.calledOnce).to.be.true;
    });

    it('should add breaking change footer with message', () => {
      const commit = new CommitMessage(header);
      commit.breaking('This is a breaking change');
      expect(commit.isBreaking).to.be.true;
    });

    it('should return the commit instance for chaining', () => {
      const commit = new CommitMessage(header);
      const result = commit.breaking();
      expect(result).to.equal(commit);
    });
  });

  describe('footer management', () => {
    it('should add a new footer', () => {
      const commit = new CommitMessage(header);
      const footer = commit.footer('Closes', '#123');
      expect(footer).to.be.instanceOf(CommitMessageFooter);
    });

    it('should update existing footer', () => {
      const commit = new CommitMessage(header);
      commit.footer('Closes', '#123');
      commit.footer('Closes', '#456');
      // Should have only one footer with updated content
    });

    it('should remove footer when message is null', () => {
      const commit = new CommitMessage(header);
      commit.footer('Closes', '#123');
      commit.footer('Closes', null);
      // Footer should be removed
    });

    it('should return existing footer when no message provided', () => {
      const commit = new CommitMessage(header);
      commit.footer('Closes', '#123');
      const footer = commit.footer('Closes');
      expect(footer).to.be.instanceOf(CommitMessageFooter);
    });

    it('should return undefined for non-existent footer', () => {
      const commit = new CommitMessage(header);
      const footer = commit.footer('NonExistent');
      expect(footer).to.be.undefined;
    });
  });

  describe('style management', () => {
    it('should set style for body', () => {
      const commit = new CommitMessage(header);
      const styleFn = sinon.stub();
      commit.setStyle(styleFn, 'body');
      // Verify style was applied to body
    });

    it('should set style for footer', () => {
      const commit = new CommitMessage(header, '', footer);
      const styleFn = sinon.stub();
      commit.setStyle(styleFn, 'footer');
      // Verify style was applied to footers
    });

    it('should set style for header parts', () => {
      const setStyle = sinon.spy(header, 'setStyle');
      const commit = new CommitMessage(header);
      const styleFn = sinon.stub();
      commit.setStyle(styleFn, 'type');
      expect(setStyle.calledWith(styleFn, 'type')).to.be.true;
    });

    it('should set style for all parts when no part specified', () => {
      const setStyleHeader = sinon.spy(header, 'setStyle');
      const setStyleFooter = sinon.spy(footer, 'setStyle');
      const commit = new CommitMessage(header, 'body', footer);
      const styleFn = sinon.stub();
      commit.setStyle(styleFn);

      expect(setStyleHeader.calledWith(styleFn)).to.be.true;
      expect(setStyleFooter.calledWith(styleFn)).to.be.true;
    });

    it('should apply style to body', () => {
      const commit = new CommitMessage(header);
      const result = commit.style('body');
      expect(result).to.equal(commit);
    });

    it('should apply style to specific footer', () => {
      const commit = new CommitMessage(header);
      commit.footer('Closes', '#123');
      const result = commit.style('footer', 'Closes');
      expect(result).to.equal(commit);
    });

    it('should apply style to all elements when no part specified', () => {
      const styleHeader = sinon.spy(header, 'style');
      const styleFooter = sinon.spy(footer, 'style');
      const commit = new CommitMessage(header, 'body', footer);
      const result = commit.style();

      expect(result).to.equal(commit);
      expect(styleHeader.calledWith('type')).to.be.true;
      expect(styleHeader.calledWith('scope')).to.be.true;
      expect(styleHeader.calledWith('subject')).to.be.true;
      expect(styleHeader.calledThrice).to.be.true;
      expect(styleFooter.calledOnce).to.be.true;
    });

    it('should unstyle body', () => {
      const commit = new CommitMessage(header);
      const result = commit.unstyle('body');
      expect(result).to.equal(commit);
    });

    it('should unstyle specific footer', () => {
      const secondFooter = new CommitMessageFooter('Second', 'footer');
      const secondFooterUnstyle = sinon.spy(secondFooter, 'unstyle');
      const commit = new CommitMessage(header, 'body', footer, secondFooter);
      const result = commit.unstyle('footer', secondFooter.token);
      expect(result).to.equal(commit);

      expect(secondFooterUnstyle.called).to.be.true;
    });

    it('should unstyle all parts when no part specified', () => {
      const commit = new CommitMessage(header);
      const result = commit.unstyle();
      expect(result).to.equal(commit);
    });
  });

  describe('getters and setters', () => {
    beforeEach(() => {
      header = new CommitMessageHeader({ type: 'feat', scope: 'auth', subject: 'I am the subject' });
      footer = new CommitMessageFooter('token', 'message');
    });

    it('should get and set type', () => {
      header.type = 'feat';
      const commit = new CommitMessage(header);
      commit.type = 'fix';
      expect(header.type).to.equal('fix');
    });

    it('should get and set subject', () => {
      header.subject = 'Test subject';
      const commit = new CommitMessage(header);
      commit.subject = 'New subject';
      expect(header.subject).to.equal('New subject');
    });

    it('should get and set scope', () => {
      header.scope = 'api';
      const commit = new CommitMessage(header);
      commit.scope = 'ui';
      expect(header.scope).to.equal('ui');
    });

    it('should get header string', () => {
      header.type = 'feat';
      header.scope = '';
      header.subject = 'test subject';
      const commit = new CommitMessage(header);
      expect(commit.header).to.equal('feat: test subject');
    });

    it('should get footers array', () => {
      footer.token = 'Closes';
      footer.text = '#123';
      const commit = new CommitMessage(header, '', footer);
      expect(commit.footers).to.deep.equal(['Closes: #123']);
    });

    it('should get addScope method', () => {
      const commit = new CommitMessage(header);
      const addScope = commit.addScope;
      expect(header.addScope).to.equal(addScope);
    });

    it('should get delScope method', () => {
      const commit = new CommitMessage(header);
      const delScope = commit.delScope;
      expect(header.delScope).to.equal(delScope);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      header.type = 'feat';
      header.scope = 'api';
      header.subject = 'add new feature';
      footer.token = 'Closes';
      footer.text = '#123';

      const commit = new CommitMessage(header, 'Test body', footer);
      const json = commit.toJSON();

      expect(json).to.deep.equal({
        type: 'feat',
        scope: 'api',
        subject: 'add new feature',
        body: 'Test body',
        footer: ['Closes: #123'],
      });
    });
  });

  describe('fromJSON', () => {
    it('should create commit from JSON with all fields', () => {
      const json = {
        type: 'feat',
        scope: 'api',
        subject: 'add feature',
        body: 'Test body',
        footer: ['Closes: #123'],
      };

      const commit = CommitMessage.fromJSON(json);
      expect(commit).to.be.instanceOf(CommitMessage);
    });

    it('should create commit from JSON with minimal fields', () => {
      const json = {
        type: 'feat',
        subject: 'add feature',
      };

      const commit = CommitMessage.fromJSON(json);
      expect(commit).to.be.instanceOf(CommitMessage);
    });

    it('should handle empty footer array', () => {
      const json = {
        type: 'feat',
        subject: 'add feature',
        footer: [],
      };

      const commit = CommitMessage.fromJSON(json);
      expect(commit.footers).to.deep.equal([]);
    });
  });

  describe('fromString', () => {
    it('should parse simple commit message', () => {
      const message = 'feat: add new feature';
      const commit = CommitMessage.fromString(message);
      expect(commit).to.be.instanceOf(CommitMessage);
    });

    it('should parse commit message with body', () => {
      const message = 'feat: add new feature\n\nThis is the body';
      const commit = CommitMessage.fromString(message);
      expect(commit.body).to.equal('This is the body');
    });

    it('should parse commit message with footers', () => {
      const message = 'feat: add new feature\n\nThis is the body\n\nCloses: #123';
      const commit = CommitMessage.fromString(message);
      expect(commit).to.be.instanceOf(CommitMessage);
    });

    it('should parse commit message with multiple footers', () => {
      const message = 'feat: add new feature\n\nCloses: #123\n\nSee-also: #456';
      const commit = CommitMessage.fromString(message);
      expect(commit).to.be.instanceOf(CommitMessage);
    });

    it('should handle empty message', () => {
      const message = '';
      const commit = CommitMessage.fromString(message);
      expect(commit).to.be.instanceOf(CommitMessage);
    });
  });

  describe('toString', () => {
    beforeEach(() => {
      header = new CommitMessageHeader({ type: 'feat', subject: 'add feature' });
      footer = new CommitMessageFooter('Closes', '#123');
    });

    it('should format commit with header only', () => {
      const commit = new CommitMessage(header);
      expect(commit.toString()).to.equal('feat: add feature');
    });

    it('should format commit with header and body', () => {
      const commit = new CommitMessage(header, 'Test body');
      expect(commit.toString()).to.equal('feat: add feature\n\nTest body');
    });

    it('should format commit with header, body, and footers', () => {
      const commit = new CommitMessage(header, 'Test body', footer);
      expect(commit.toString()).to.equal('feat: add feature\n\nTest body\n\nCloses: #123');
    });

    it('should format commit with header and footers but no body', () => {
      const commit = new CommitMessage(header, '', footer);
      expect(commit.toString()).to.equal('feat: add feature\n\nCloses: #123');
    });
  });

  // Integration tests from existing file
  describe('Commit Message Formatting', () => {
    it('should format a basic commit message', () => {
      const commit = {
        type: 'feat',
        subject: 'Add new feature',
        body: '',
      };
      const message = CommitMessage.fromJSON(commit).toString();
      expect(message).to.equal('feat: Add new feature');
    });

    it('should format a commit message with breaking change', () => {
      const commit = {
        type: 'feat',
        subject: 'Add breaking feature',
        body: '',
      };
      const message = CommitMessage.fromJSON(commit).breaking().toString();
      expect(message).to.include('feat!: Add breaking feature');
    });

    it('should format a commit message with body', () => {
      const commit = {
        type: 'fix',
        subject: 'Fix critical bug',
        body: 'This fixes a critical issue\nThat was causing problems',
      };

      const message = CommitMessage.fromJSON(commit).toString();
      expect(message).to.include('fix: Fix critical bug');
      expect(message).to.include('This fixes a critical issue\nThat was causing problems');
    });

    it('should format a breaking commit message with body', () => {
      const commit = {
        subject: 'Fix critical bug',
        body: 'This fixes a critical issue\nThat was causing problems',
      };
      const message = CommitMessage.fromJSON(commit).breaking().toString();
      expect(message).to.include('Fix critical bug');
      expect(message).to.include('This fixes a critical issue\nThat was causing problems');
    });
  });
});
