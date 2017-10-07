# Algolia Search API Client for JavaScript

[Algolia Search](https://www.algolia.com) is a hosted full-text, numerical, and faceted search engine capable of delivering realtime results from the first keystroke.
The **Algolia Search API Client for JavaScript** lets you easily use the [Algolia Search REST API](https://www.algolia.com/doc/rest-api/search) from your JavaScript code.

[![Version][version-svg]][package-url] [![Build Status][travis-svg]][travis-url] [![License][license-image]][license-url] [![Downloads][downloads-image]][downloads-url]

[![Browser tests][browser-test-matrix]][browser-test-url]

[travis-svg]: https://img.shields.io/travis/algolia/algoliasearch-client-javascript/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/algolia/algoliasearch-client-javascript
[license-image]: https://img.shields.io/badge/license-MIT-green.svg?style=flat-square
[license-url]: LICENSE.txt
[downloads-image]: https://img.shields.io/npm/dm/algoliasearch.svg?style=flat-square
[downloads-url]: http://npm-stat.com/charts.html?package=algoliasearch
[browser-test-matrix]: https://saucelabs.com/browser-matrix/algoliasearch-js.svg
[browser-test-url]: https://saucelabs.com/u/algoliasearch-js
[version-svg]: https://img.shields.io/npm/v/algoliasearch.svg?style=flat-square
[package-url]: https://npmjs.org/package/algoliasearch


The JavaScript client works both on the frontend (browsers) or on the backend (Node.js) with the same API.

The backend (Node.js) API can be used to index your data using your Algolia admin API keys.

Our JavaScript library is [UMD](https://github.com/umdjs/umd) compatible, you can
use it with any module loader.

When not using any module loader, it will export an `algoliasearch` function in the `window` object.




## API Documentation

You can find the full reference on [Algolia's website](https://www.algolia.com/doc/api-client/javascript/).


## Table of Contents


1. **[Install](#install)**

    * [Frontend](#frontend)
    * [Node.js / React Native / Browserify / webpack](#nodejs--react-native--browserify--webpack)
    * [TypeScript typings](#typescript-typings)
    * [NativeScript](#nativescript)
    * [Bower](#bower)
    * [&lt;script&gt; tag using CDNs](#script-tag-using-cdns)
    * [Search only/lite client](#search-onlylite-client)

1. **[Quick Start](#quick-start)**

    * [Initialize the client](#initialize-the-client)
    * [Push data](#push-data)
    * [Search](#search)
    * [Configure](#configure)
    * [Client options](#client-options)
    * [Callback convention](#callback-convention)
    * [Promises](#promises)
    * [Request strategy](#request-strategy)
    * [Cache](#cache)
    * [Proxy support](#proxy-support)
    * [Keep-alive](#keep-alive)
    * [Debugging](#debugging)

1. **[Getting Help](#getting-help)**





# Getting Started



## Install

#### Frontend

You can either use a package manager like npm or include a `<script>` tag.

#### Node.js / React Native / Browserify / webpack

We are [browserify](http://browserify.org/)able and [webpack](http://webpack.github.io/) friendly.

```sh
npm install algoliasearch --save
```

#### TypeScript typings

For Typescript typings, we provide the definition file via [typings](https://github.com/typings/typings)

```sh
npm install --save @types/algoliasearch
```

#### NativeScript

```sh
tns plugin add nativescript-algolia
```
#### Bower

```sh
bower install algoliasearch -S
```

#### &lt;script&gt; tag using CDNs

##### Recommended: jsDelivr.com

[jsDelivr](http://www.jsdelivr.com/about.php) is a global CDN delivery for JavaScript libraries.

To include the latest releases and all upcoming features and patches, use this:

```html
<script src="https://cdn.jsdelivr.net/algoliasearch/3/algoliasearch.min.js"></script>
```

##### Other CDNS

We recommend using jsDelivr, but `algoliasearch` is also available at:
- [CDNJS](https://cdnjs.com/libraries/algoliasearch)
- [unpkg](https://unpkg.com): https://unpkg.com/algoliasearch@3/dist/algoliasearch.min.js

#### Search only/lite client

We have a lightweight build available that can only do searches. Use it when filesize
is important to you or if you like to include only what you need.

Find it on jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/algoliasearch/3/algoliasearchLite.min.js"></script>
```

## Quick Start

In 30 seconds, this quick start tutorial will show you how to index and search objects.

### Initialize the client

You first need to initialize the client. For that you need your **Application ID** and **API Key**.
You can find both of them on [your Algolia account](https://www.algolia.com/api-keys).

```js
// var algoliasearch = require('algoliasearch');
// var algoliasearch = require('algoliasearch/reactnative');
// var algoliasearch = require('algoliasearch/lite');
// or just use algoliasearch if you are using a <script> tag
// if you are using AMD module loader, algoliasearch will not be defined in window,
// but in the AMD modules of the page

var client = algoliasearch('applicationID', 'apiKey');
```

### Push data

Without any prior configuration, you can start indexing [500 contacts](https://github.com/algolia/datasets-public/blob/master/contacts.json) in the `contacts` index using the following code:

```js
var index = client.initIndex('contacts');
var contactsJSON = require('./contacts.json');

index.addObjects(contactsJSON, function(err, content) {
  if (err) {
    console.error(err);
  }
});
```

### Search

You can now search for contacts using firstname, lastname, company, etc. (even with typos):

```js
// firstname
index.search('jimmie', function(err, content) {
  console.log(content.hits);
});

// firstname with typo
index.search('jimie', function(err, content) {
  console.log(content.hits);
});

// a company
index.search('california paint', function(err, content) {
  console.log(content.hits);
});

// a firstname & company
index.search('jimmie paint', function(err, content) {
  console.log(content.hits);
});
```

### Configure

Settings can be customized to tune the search behavior. For example, you can add a custom sort by number of followers to the already great built-in relevance:

```js
index.setSettings({
  'customRanking': ['desc(followers)']
}, function(err, content) {
  console.log(content);
});
```

You can also configure the list of attributes you want to index by order of importance (first = most important):

**Note:** Since the engine is designed to suggest results as you type, you'll generally search by prefix.
In this case the order of attributes is very important to decide which hit is the best:

```js
index.setSettings({
  'searchableAttributes': [
    'lastname',
    'firstname',
    'company',
    'email',
    'city',
    'address'
  ]
}, function(err, content) {
  console.log(content);
});
```

### Client options

In most situations, there is no need to tune the options. We provide this list to be
transparent with our users.

- `timeout` (Number) timeout for requests to our servers, in milliseconds
  + in Node.js this is an inactivity timeout. Defaults to 15s
  + in the browser, this is a global timeout. Defaults to 2s (incremental)
- `protocol` (String) protocol to use when communicating with algolia
  + in the browser, we use the page protocol by default
  + in Node.js it's https by default
  + possible values: 'http:', 'https:'
- `hosts.read` ([String]) array of read hosts to use to call Algolia servers, computed automatically
- `hosts.write` ([String]) array of write hosts to use to call Algolia servers, computed automatically
- `httpAgent` ([HttpAgent](https://nodejs.org/api/http.html#http_class_http_agent)) <sup>node-only</sup> Node.js httpAgent instance to use when communicating with Algolia servers.

To pass an option, use:

```js
var client = algoliasearch(applicationId, apiKey, {
  timeout: 4000
})
```

### Callback convention

Every API call takes a callback as last parameter. This callback will then be called with two arguments:

 1. **error**: null or an [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object. More info on the error can be find in `error.message`.
 2. **content**: the object containing the answer from the server, it's a JavaScript object

### Promises

**If you do not provide a callback**, you will get a promise (but never both).

Promises are the [native Promise implementation](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise).

We use [jakearchibald/es6-promise](https://github.com/stefanpenner/es6-promise) as a polyfill when needed.

### Request strategy

The request strategy used by the JavaScript client includes:

- On the browser:
  + [CORS](https://en.wikipedia.org/wiki/Cross-Origin_Resource_Sharing#Browser_support) for modern browsers
  + [XDomainRequest](https://msdn.microsoft.com/en-us/library/ie/cc288060%28v=vs.85%29.aspx) for IE <= 10
  + [JSONP](https://en.wikipedia.org/wiki/JSONP) in any situation where Ajax requests are unavailabe or blocked.
- Node.js:
  + native [`http` module](https://nodejs.org/api/)

Connections are always `keep-alive`.

### Cache

**Browser only**

To avoid performing the same API calls twice **search** results will be stored
in a `cache` that will be tied to your JavaScript `client` and `index` objects.
Whenever a call for a specific query (and filters) is made, we store the results
in a local cache. If you ever call the exact same query again, we read the
results from the cache instead of doing an API call.

This is particularly useful when your users are deleting characters from their
current query, to avoid useless API calls. Because it is stored as a simple
JavaScript object in memory, the cache is automatically reset whenever you
reload the page.

It is never automatically purged, nor can it be completely disabled. Instead, we
provide the `index.clearCache()` (or `client.clearCache()` if you're using the
[Search multiple indices](#search-multiple-indices) method that you can call to reset it.

### Proxy support

**Node.js only**

If you are behind a proxy, just set `HTTP_PROXY` or `HTTPS_PROXY` environment variables before starting your Node.js program.

```sh
HTTP_PROXY=http://someproxy.com:9320 node main.js
```

### Keep-alive

**Node.js only**

Keep-alive is activated by default.

Because of the nature of keepalive connections, your process will hang even if you do not do any more command using the `client`.

To fix this, we expose a `client.destroy()` method that will terminate all remaining alive connections.

You should call this method when you are finished working with the AlgoliaSearch API. So that your process will exit gently.

**Note: keep-alive is still always activated in browsers, this is a native behavior of browsers.**

### Debugging

The client will send you errors when a method call fails for some reasons.

You can get detailed debugging information:

```js
index.search('something', function searchDone(err) {
  if (err) {
    console.log(err.message);
    console.log(err.debugData);
    return;
  }
});
```

`err.debugData` contains the array of requests parameters that were used to issue requests.

## Getting Help

- **Need help**? Ask a question to the [Algolia Community](https://discourse.algolia.com/) or on [Stack Overflow](http://stackoverflow.com/questions/tagged/algolia).
- **Found a bug?** You can open a [GitHub issue](https://github.com/algolia/algoliasearch-client-javascript/issues).



