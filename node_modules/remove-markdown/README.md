[![CircleCI](https://circleci.com/gh/stiang/remove-markdown.svg?style=svg&circle-token=cac2feef7dc90e6b8578aec361be369412be1c6a)](https://circleci.com/gh/stiang/remove-markdown)

## What is it?
**remove-markdown** is a node.js module that will remove (strip) Markdown formatting from a text. "Markdown formatting" means pretty much anything that doesn’t look like regular text, like square brackets, asterisks etc.

## When do I need it?
The typical use case is to display an excerpt of a Markdown text, without the actual Markdown (or rendered HTML, for that matter), for example in a list of posts.

## Installation

```
npm install remove-markdown
```

## Usage
```js
const removeMd = require('remove-markdown');
const markdown = '# This is a heading\n\nThis is a paragraph with [a link](http://www.disney.com/) in it.';
const plainText = removeMd(markdown); // plainText is now 'This is a heading\n\nThis is a paragraph with a link in it.'
```

You can also supply an options object to the function. Currently, the following options are supported:

```js
var plainText = removeMd(markdown, {
  stripListLeaders: true , // strip list leaders (default: true)
  listUnicodeChar: '',     // char to insert instead of stripped list leaders (default: '')
  gfm: true                // support GitHub-Flavored Markdown (default: true)
});
```

Setting `stripListLeaders` to false will retain any list characters (`*, -, +, (digit).`).

## TODO
PRs are very much welcome.
* Allow the RegEx expressions to be customized per rule
* Make the rules more robust, support more edge cases
* Add more (comprehensive) tests

## Credits
The code is based on [Markdown Service Tools - Strip Markdown](http://brettterpstra.com/2013/10/18/a-markdown-service-to-strip-markdown/) by Brett Terpstra.

## Author
Stian Grytøyr
