'use strict';
const expect = require('chai').expect;
const removeMd = require('../');

describe('remove Markdown', function () {
  describe('removeMd', function () {
    it('should leave a string alone without markdown', function () {
      const string = 'Javascript Developers are the best.';
      expect(removeMd(string)).to.equal(string);
    });

    it('should strip out remaining markdown', function () {
      const string = '*Javascript* developers are the _best_.';
      const expected = 'Javascript developers are the best.';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should leave non-matching markdown markdown', function () {
      const string = '*Javascript* developers* are the _best_.';
      const expected = 'Javascript developers* are the best.';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should leave non-matching markdown, but strip empty anchors', function () {
      const string = '*Javascript* [developers]()* are the _best_.';
      const expected = 'Javascript developers* are the best.';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should strip HTML', function () {
      const string = '<p>Hello World</p>';
      const expected = 'Hello World';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should strip anchors', function () {
      const string = '*Javascript* [developers](https://engineering.condenast.io/)* are the _best_.';
      const expected = 'Javascript developers* are the best.';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should strip img tags', function () {
      const string = '![bear](https://placebear.com/640/480)*Javascript* developers are the _best_.';
      const expected = 'Javascript developers are the best.';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should strip code tags', function () {
      const string = 'In `Getting Started` we set up `something` foo.';
      const expected = 'In Getting Started we set up something foo.';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should leave hashtags in headings', function () {
      const string = '## This #heading contains #hashtags';
      const expected = 'This #heading contains #hashtags';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should remove emphasis', function () {
      const string = 'I italicized an *I* and it _made_ me *sad*.';
      const expected = 'I italicized an I and it made me sad.';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should remove double emphasis', function () {
      const string = '**this sentence has __double styling__**';
      const expected = 'this sentence has double styling';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should remove horizontal rules', function () {
      const string = 'Some text on a line\n\n---\n\nA line below';
      const expected = 'Some text on a line\n\nA line below';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should remove horizontal rules with space-separated asterisks', function () {
      const string = 'Some text on a line\n\n* * *\n\nA line below';
      const expected = 'Some text on a line\n\nA line below';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should remove blockquotes', function () {
      const string = '>I am a blockquote';
      const expected = 'I am a blockquote';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should remove blockquotes with spaces', function () {
      const string = '> I am a blockquote';
      const expected = 'I am a blockquote';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should remove indented blockquotes', function () {
        var tests = [
            { string: ' > I am a blockquote', expected: 'I am a blockquote' },
            { string: '  > I am a blockquote', expected: 'I am a blockquote' },
            { string: '   > I am a blockquote', expected: 'I am a blockquote' },
        ];
        tests.forEach(function (test) {
            expect(removeMd(test.string)).to.equal(test.expected);
        });
    });

    it('should not remove greater than signs', function () {
      var tests = [
          { string: '100 > 0', expected: '100 > 0' },
          { string: '100 >= 0', expected: '100 >= 0' },
          { string: '100>0', expected: '100>0' },
          { string: '> 100 > 0', expected: '100 > 0' },
          { string: '1 < 100', expected: '1 < 100' },
          { string: '1 <= 100', expected: '1 <= 100' },
      ];
      tests.forEach(function (test) {
          expect(removeMd(test.string)).to.equal(test.expected);
      });
    });

    it('should strip unordered list leaders', function () {
      const string = 'Some text on a line\n\n* A list Item\n* Another list item';
      const expected = 'Some text on a line\n\nA list Item\nAnother list item';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should strip ordered list leaders', function () {
      const string = 'Some text on a line\n\n9. A list Item\n10. Another list item';
      const expected = 'Some text on a line\n\nA list Item\nAnother list item';
      expect(removeMd(string)).to.equal(expected);
    });

    it('should handle paragraphs with markdown', function () {
      const paragraph = '\n## This is a heading ##\n\nThis is a paragraph with [a link](http://www.disney.com/).\n\n### This is another heading\n\nIn `Getting Started` we set up `something` foo.\n\n  * Some list\n  * With items\n    * Even indented';
      const expected = '\nThis is a heading\n\nThis is a paragraph with a link.\n\nThis is another heading\n\nIn Getting Started we set up something foo.\n\n  Some list\n  With items\n    Even indented';
      expect(removeMd(paragraph)).to.equal(expected);
    });
  });
});
