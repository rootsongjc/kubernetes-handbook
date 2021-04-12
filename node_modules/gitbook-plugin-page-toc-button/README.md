# Gitbook Page TOC Button Plugin [![npm version](https://badge.fury.io/js/gitbook-plugin-page-toc-button.svg)](https://badge.fury.io/js/gitbook-plugin-page-toc-button)

This plugin adds a table of content (TOC) button to your GitBook page. All three GitBook themes (White, Sepia, Night) are supported. This project took heavy inspiration from https://plugins.gitbook.com/plugin/anchor-navigation.

## Usage

### Installation

Add the plugin to your `book.json`:

```
{
	"plugins" : [ "page-toc-button" ]
}		
```

### Optional configuration

You can add the following configuration params to your `book.json`:

```
{
	"plugins" : [ 
		"page-toc-button" 
	],
	"pluginsConfig": {
		"page-toc-button": {
			"maxTocDepth": 2,
			"minTocSize": 2
   		}
	}
}			
```

Name        | Type    | Default | Description 
----------- | ------- | ------- | ------------
maxTocDepth | Number  |       2 | Maximal depth of headers (2 = h1 + h2 + h3). A value > 2 is not supported.
minTocSize  | Number  |       2 | Minimal number of toc entries for showing the toc button.

## Screenshots

The page toc button:

![Page Toc Button](https://raw.githubusercontent.com/stuebersystems/gitbook-plugin-page-toc-button/master/screenshot1.png)

The page toc menu:

![Page Toc Menu](https://raw.githubusercontent.com/stuebersystems/gitbook-plugin-page-toc-button/master/screenshot2.png)

## Changelog

* 0.1.0 Releases:
  * 0.1.0 First release
  * 0.1.1 Button icon switched
