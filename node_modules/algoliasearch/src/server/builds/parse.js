'use strict';

// This is the Parse entry point
// See https://www.parse.com/docs/cloud_code_guide#cloud_code
module.exports = algoliasearch;

// by default parse has no process.env,
// force it down for npm modules compatibility
if (process.env === undefined) {
  process.env = {};
}

// a lot of node modules are expecting to find a `global` object,
// this has triggered some bugs
/* global global: true */
global = global || {};

var debug = require('debug')('algoliasearch:parse');

var inherits = require('inherits');

var AlgoliaSearchServer = require('./AlgoliaSearchServer');

debug('loaded the Parse client');

function algoliasearch(applicationID, apiKey, opts) {
  var cloneDeep = require('../../clone.js');
  opts = cloneDeep(opts || {});

  if (opts.protocol === undefined) {
    opts.protocol = 'https:';
  }

  opts.timeouts = opts.timeouts || {
    connect: 2 * 1000,
    read: 7 * 1000,
    write: 30 * 1000
  };

  opts._setTimeout = _setTimeout;

  opts._ua = opts._ua || algoliasearch.ua;
  opts._useCache = false;

  return new AlgoliaSearchParse(applicationID, apiKey, opts);
}

algoliasearch.version = require('../../version.js');
algoliasearch.ua = 'Algolia for Parse ' + algoliasearch.version;

function AlgoliaSearchParse() {
  // call AlgoliaSearchServer constructor
  AlgoliaSearchServer.apply(this, arguments);
}

inherits(AlgoliaSearchParse, AlgoliaSearchServer);

AlgoliaSearchParse.prototype._request = function(rawUrl, opts) {
  /* global Parse */
  var clone = require('../../clone.js');
  var promise = new Parse.Promise();

  debug('url: %s, opts: %j', rawUrl, opts);

  var parseReqOpts = {
    url: rawUrl,
    headers: clone(opts.headers),
    method: opts.method,
    success: success,
    error: error
  };

  if (opts.body) {
    // parse is proxing our requests and requires us to set a charset. while json is always utf-8
    parseReqOpts.headers['content-type'] = 'application/json;charset=utf-8';
    parseReqOpts.body = opts.body;
  }

  Parse.Cloud.httpRequest(parseReqOpts);

  function error(res) {
    debug('error: %j  - %s %j', res, rawUrl, opts);

    // we still resolve, bc Parse does not distinguish network errors
    // from 400/500 statuses
    promise.resolve({
      statusCode: res.status,
      body: res.data,
      headers: res.headers
    });
  }

  function success(res) {
    debug('success: %j  - %s %j', res, rawUrl, opts);

    promise.resolve({
      statusCode: res.status,
      body: res.data,
      headers: res.headers
    });
  }

  return promise;
};

AlgoliaSearchParse.prototype._promise = {
  reject: function(val) {
    return Parse.Promise.error(val);
  },
  resolve: function(val) {
    return Parse.Promise.as(val);
  },
  delay: function(ms) {
    var promise = new Parse.Promise();

    _setTimeout(promise.resolve.bind(promise), ms);

    return promise;
  }
};

// There's no setTimeout in Parse cloud, but we have nextTick
function _setTimeout(fn, ms) {
  var start = Date.now();

  process.nextTick(fakeSetTimeout);

  function fakeSetTimeout() {
    if (Date.now() < start + ms) {
      process.nextTick(fakeSetTimeout);
      return;
    }

    fn();
  }
}
