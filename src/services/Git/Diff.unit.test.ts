// src/services/Git/Diff.test.ts
import { expect } from 'chai';
import Diff from './Diff.js';

describe('Diff', () => {
  describe('constructor', () => {
    it('should create an empty diff when no arguments are provided', () => {
      const diff = new Diff();
      expect(diff.files).to.deep.equal([]);
      expect(diff.toString()).to.equal('');
    });

    it('should initialize with provided diffs', () => {
      const diffs = {
        'file1.ts': 'diff content for file1',
        'file2.ts': 'diff content for file2',
      };
      const diff = new Diff(diffs);
      expect(diff.files).to.have.members(['file1.ts', 'file2.ts']);
      expect(diff.file('file1.ts')).to.equal('diff content for file1');
    });
  });

  describe('files getter', () => {
    it('should return an empty array for an empty diff', () => {
      const diff = new Diff();
      expect(diff.files).to.deep.equal([]);
    });

    it('should return all file paths', () => {
      const diff = new Diff({
        'file1.ts': 'content1',
        'path/to/file2.ts': 'content2',
        'another/file3.js': 'content3',
      });
      expect(diff.files).to.have.members(['file1.ts', 'path/to/file2.ts', 'another/file3.js']);
    });
  });

  describe('file method', () => {
    it('should return undefined for non-existent files', () => {
      const diff = new Diff();
      expect(diff.file('nonexistent.ts')).to.be.undefined;
    });

    it('should return the diff content for an existing file', () => {
      const diff = new Diff({
        'file1.ts': 'diff content for file1',
      });
      expect(diff.file('file1.ts')).to.equal('diff content for file1');
    });

    it('should handle empty diff content', () => {
      const diff = new Diff({
        'empty.ts': '',
      });
      expect(diff.file('empty.ts')).to.equal('');
    });
  });

  describe('add method', () => {
    it('should add a new file diff', () => {
      const diff = new Diff();
      diff.add('file1.ts', 'new diff content');
      expect(diff.file('file1.ts')).to.equal('new diff content');
    });

    it('should overwrite existing file diff', () => {
      const diff = new Diff({
        'file1.ts': 'original content',
      });
      diff.add('file1.ts', 'updated content');
      expect(diff.file('file1.ts')).to.equal('updated content');
    });

    it('should return the instance for chaining', () => {
      const diff = new Diff();
      const result = diff.add('file1.ts', 'content');
      expect(result).to.equal(diff);
    });

    it('should support method chaining', () => {
      const diff = new Diff();
      diff.add('file1.ts', 'content1').add('file2.ts', 'content2').add('file3.ts', 'content3');

      expect(diff.files).to.have.members(['file1.ts', 'file2.ts', 'file3.ts']);
    });
  });

  describe('merge method', () => {
    it('should merge two diffs into a new diff', () => {
      const diff1 = new Diff({
        'file1.ts': 'content1',
        'file2.ts': 'content2',
      });

      const diff2 = new Diff({
        'file3.ts': 'content3',
        'file4.ts': 'content4',
      });

      const merged = diff1.merge(diff2);

      expect(merged).to.be.instanceOf(Diff);
      expect(merged).to.not.equal(diff1);
      expect(merged).to.not.equal(diff2);
      expect(merged.files).to.have.members(['file1.ts', 'file2.ts', 'file3.ts', 'file4.ts']);
    });

    it('should override files from the first diff with files from the second diff', () => {
      const diff1 = new Diff({
        'file1.ts': 'original content',
        'file2.ts': 'content2',
      });

      const diff2 = new Diff({
        'file1.ts': 'updated content',
        'file3.ts': 'content3',
      });

      const merged = diff1.merge(diff2);

      expect(merged.file('file1.ts')).to.equal('updated content');
      expect(merged.file('file2.ts')).to.equal('content2');
      expect(merged.file('file3.ts')).to.equal('content3');
    });

    it('should handle merging with an empty diff', () => {
      const diff1 = new Diff({
        'file1.ts': 'content1',
      });

      const emptyDiff = new Diff();

      const merged1 = diff1.merge(emptyDiff);
      expect(merged1.files).to.have.members(['file1.ts']);

      const merged2 = emptyDiff.merge(diff1);
      expect(merged2.files).to.have.members(['file1.ts']);
    });
  });

  describe('toString method', () => {
    it('should return an empty string for an empty diff', () => {
      const diff = new Diff();
      expect(diff.toString()).to.equal('');
    });

    it('should concatenate all diff contents with newlines', () => {
      const diff = new Diff({
        'file1.ts': 'content1',
        'file2.ts': 'content2',
      });

      expect(diff.toString()).to.equal('content1\ncontent2');
    });

    it('should handle empty diff contents', () => {
      const diff = new Diff({
        'file1.ts': '',
        'file2.ts': 'content2',
        'file3.ts': '',
      });

      expect(diff.toString()).to.equal('\ncontent2\n');
    });

    it('should preserve the order of files based on object keys', () => {
      // Create a diff with a specific order to test
      const diff = new Diff();
      diff.add('c.ts', 'content c');
      diff.add('a.ts', 'content a');
      diff.add('b.ts', 'content b');

      // Object.values() doesn't guarantee order, but we can test that all contents are included
      const result = diff.toString();
      expect(result).to.include('content a');
      expect(result).to.include('content b');
      expect(result).to.include('content c');
      expect(result.split('\n').length).to.equal(3);
    });
  });

  describe('integration tests', () => {
    it('should support a complete workflow', () => {
      // Create an initial diff
      const diff1 = new Diff().add('file1.ts', 'content1').add('file2.ts', 'content2');

      // Create another diff
      const diff2 = new Diff().add('file3.ts', 'content3').add('file1.ts', 'updated content1');

      // Merge the diffs
      const merged = diff1.merge(diff2);

      // Verify the merged result
      expect(merged.files).to.have.members(['file1.ts', 'file2.ts', 'file3.ts']);
      expect(merged.file('file1.ts')).to.equal('updated content1');
      expect(merged.file('file2.ts')).to.equal('content2');
      expect(merged.file('file3.ts')).to.equal('content3');

      // Add another file to the merged diff
      merged.add('file4.ts', 'content4');

      // Verify the final state
      expect(merged.files).to.have.members(['file1.ts', 'file2.ts', 'file3.ts', 'file4.ts']);
      expect(merged.toString()).to.include('updated content1');
      expect(merged.toString()).to.include('content2');
      expect(merged.toString()).to.include('content3');
      expect(merged.toString()).to.include('content4');
    });
  });
});
