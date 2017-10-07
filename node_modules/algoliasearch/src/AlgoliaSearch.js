module.exports = AlgoliaSearch;

var Index = require('./Index.js');
var deprecate = require('./deprecate.js');
var deprecatedMessage = require('./deprecatedMessage.js');
var AlgoliaSearchCore = require('./AlgoliaSearchCore.js');
var inherits = require('inherits');
var errors = require('./errors');

function AlgoliaSearch() {
  AlgoliaSearchCore.apply(this, arguments);
}

inherits(AlgoliaSearch, AlgoliaSearchCore);

/*
 * Delete an index
 *
 * @param indexName the name of index to delete
 * @param callback the result callback called with two arguments
 *  error: null or Error('message')
 *  content: the server answer that contains the task ID
 */
AlgoliaSearch.prototype.deleteIndex = function(indexName, callback) {
  return this._jsonRequest({
    method: 'DELETE',
    url: '/1/indexes/' + encodeURIComponent(indexName),
    hostType: 'write',
    callback: callback
  });
};

/**
 * Move an existing index.
 * @param srcIndexName the name of index to copy.
 * @param dstIndexName the new index name that will contains a copy of
 * srcIndexName (destination will be overriten if it already exist).
 * @param callback the result callback called with two arguments
 *  error: null or Error('message')
 *  content: the server answer that contains the task ID
 */
AlgoliaSearch.prototype.moveIndex = function(srcIndexName, dstIndexName, callback) {
  var postObj = {
    operation: 'move', destination: dstIndexName
  };
  return this._jsonRequest({
    method: 'POST',
    url: '/1/indexes/' + encodeURIComponent(srcIndexName) + '/operation',
    body: postObj,
    hostType: 'write',
    callback: callback
  });
};

/**
 * Copy an existing index.
 * @param srcIndexName the name of index to copy.
 * @param dstIndexName the new index name that will contains a copy
 * of srcIndexName (destination will be overriten if it already exist).
 * @param callback the result callback called with two arguments
 *  error: null or Error('message')
 *  content: the server answer that contains the task ID
 */
AlgoliaSearch.prototype.copyIndex = function(srcIndexName, dstIndexName, callback) {
  var postObj = {
    operation: 'copy', destination: dstIndexName
  };
  return this._jsonRequest({
    method: 'POST',
    url: '/1/indexes/' + encodeURIComponent(srcIndexName) + '/operation',
    body: postObj,
    hostType: 'write',
    callback: callback
  });
};

/**
 * Return last log entries.
 * @param offset Specify the first entry to retrieve (0-based, 0 is the most recent log entry).
 * @param length Specify the maximum number of entries to retrieve starting
 * at offset. Maximum allowed value: 1000.
 * @param type Specify the maximum number of entries to retrieve starting
 * at offset. Maximum allowed value: 1000.
 * @param callback the result callback called with two arguments
 *  error: null or Error('message')
 *  content: the server answer that contains the task ID
 */
AlgoliaSearch.prototype.getLogs = function(offset, length, callback) {
  var clone = require('./clone.js');
  var params = {};
  if (typeof offset === 'object') {
    // getLogs(params)
    params = clone(offset);
    callback = length;
  } else if (arguments.length === 0 || typeof offset === 'function') {
    // getLogs([cb])
    callback = offset;
  } else if (arguments.length === 1 || typeof length === 'function') {
    // getLogs(1, [cb)]
    callback = length;
    params.offset = offset;
  } else {
    // getLogs(1, 2, [cb])
    params.offset = offset;
    params.length = length;
  }

  if (params.offset === undefined) params.offset = 0;
  if (params.length === undefined) params.length = 10;

  return this._jsonRequest({
    method: 'GET',
    url: '/1/logs?' + this._getSearchParams(params, ''),
    hostType: 'read',
    callback: callback
  });
};

/*
 * List all existing indexes (paginated)
 *
 * @param page The page to retrieve, starting at 0.
 * @param callback the result callback called with two arguments
 *  error: null or Error('message')
 *  content: the server answer with index list
 */
AlgoliaSearch.prototype.listIndexes = function(page, callback) {
  var params = '';

  if (page === undefined || typeof page === 'function') {
    callback = page;
  } else {
    params = '?page=' + page;
  }

  return this._jsonRequest({
    method: 'GET',
    url: '/1/indexes' + params,
    hostType: 'read',
    callback: callback
  });
};

/*
 * Get the index object initialized
 *
 * @param indexName the name of index
 * @param callback the result callback with one argument (the Index instance)
 */
AlgoliaSearch.prototype.initIndex = function(indexName) {
  return new Index(this, indexName);
};

/*
 * @deprecated use client.listApiKeys
 */
AlgoliaSearch.prototype.listUserKeys = deprecate(function(callback) {
  return this.listApiKeys(callback);
}, deprecatedMessage('client.listUserKeys()', 'client.listApiKeys()'));

/*
 * List all existing api keys with their associated ACLs
 *
 * @param callback the result callback called with two arguments
 *  error: null or Error('message')
 *  content: the server answer with api keys list
 */
AlgoliaSearch.prototype.listApiKeys = function(callback) {
  return this._jsonRequest({
    method: 'GET',
    url: '/1/keys',
    hostType: 'read',
    callback: callback
  });
};

/*
 * @deprecated see client.getApiKey
 */
AlgoliaSearch.prototype.getUserKeyACL = deprecate(function(key, callback) {
  return this.getApiKey(key, callback);
}, deprecatedMessage('client.getUserKeyACL()', 'client.getApiKey()'));

/*
 * Get an API key
 *
 * @param key
 * @param callback the result callback called with two arguments
 *  error: null or Error('message')
 *  content: the server answer with the right API key
 */
AlgoliaSearch.prototype.getApiKey = function(key, callback) {
  return this._jsonRequest({
    method: 'GET',
    url: '/1/keys/' + key,
    hostType: 'read',
    callback: callback
  });
};

/*
 * @deprecated see client.deleteApiKey
 */
AlgoliaSearch.prototype.deleteUserKey = deprecate(function(key, callback) {
  return this.deleteApiKey(key, callback);
}, deprecatedMessage('client.deleteUserKey()', 'client.deleteApiKey()'));

/*
 * Delete an existing API key
 * @param key
 * @param callback the result callback called with two arguments
 *  error: null or Error('message')
 *  content: the server answer with the date of deletion
 */
AlgoliaSearch.prototype.deleteApiKey = function(key, callback) {
  return this._jsonRequest({
    method: 'DELETE',
    url: '/1/keys/' + key,
    hostType: 'write',
    callback: callback
  });
};

/*
 @deprecated see client.addApiKey
 */
AlgoliaSearch.prototype.addUserKey = deprecate(function(acls, params, callback) {
  return this.addApiKey(acls, params, callback);
}, deprecatedMessage('client.addUserKey()', 'client.addApiKey()'));

/*
 * Add a new global API key
 *
 * @param {string[]} acls - The list of ACL for this key. Defined by an array of strings that
 *   can contains the following values:
 *     - search: allow to search (https and http)
 *     - addObject: allows to add/update an object in the index (https only)
 *     - deleteObject : allows to delete an existing object (https only)
 *     - deleteIndex : allows to delete index content (https only)
 *     - settings : allows to get index settings (https only)
 *     - editSettings : allows to change index settings (https only)
 * @param {Object} [params] - Optionnal parameters to set for the key
 * @param {number} params.validity - Number of seconds after which the key will be automatically removed (0 means no time limit for this key)
 * @param {number} params.maxQueriesPerIPPerHour - Number of API calls allowed from an IP address per hour
 * @param {number} params.maxHitsPerQuery - Number of hits this API key can retrieve in one call
 * @param {string[]} params.indexes - Allowed targeted indexes for this key
 * @param {string} params.description - A description for your key
 * @param {string[]} params.referers - A list of authorized referers
 * @param {Object} params.queryParameters - Force the key to use specific query parameters
 * @param {Function} callback - The result callback called with two arguments
 *   error: null or Error('message')
 *   content: the server answer with the added API key
 * @return {Promise|undefined} Returns a promise if no callback given
 * @example
 * client.addUserKey(['search'], {
 *   validity: 300,
 *   maxQueriesPerIPPerHour: 2000,
 *   maxHitsPerQuery: 3,
 *   indexes: ['fruits'],
 *   description: 'Eat three fruits',
 *   referers: ['*.algolia.com'],
 *   queryParameters: {
 *     tagFilters: ['public'],
 *   }
 * })
 * @see {@link https://www.algolia.com/doc/rest_api#AddKey|Algolia REST API Documentation}
 */
AlgoliaSearch.prototype.addApiKey = function(acls, params, callback) {
  var isArray = require('isarray');
  var usage = 'Usage: client.addApiKey(arrayOfAcls[, params, callback])';

  if (!isArray(acls)) {
    throw new Error(usage);
  }

  if (arguments.length === 1 || typeof params === 'function') {
    callback = params;
    params = null;
  }

  var postObj = {
    acl: acls
  };

  if (params) {
    postObj.validity = params.validity;
    postObj.maxQueriesPerIPPerHour = params.maxQueriesPerIPPerHour;
    postObj.maxHitsPerQuery = params.maxHitsPerQuery;
    postObj.indexes = params.indexes;
    postObj.description = params.description;

    if (params.queryParameters) {
      postObj.queryParameters = this._getSearchParams(params.queryParameters, '');
    }

    postObj.referers = params.referers;
  }

  return this._jsonRequest({
    method: 'POST',
    url: '/1/keys',
    body: postObj,
    hostType: 'write',
    callback: callback
  });
};

/**
 * @deprecated Please use client.addApiKey()
 */
AlgoliaSearch.prototype.addUserKeyWithValidity = deprecate(function(acls, params, callback) {
  return this.addApiKey(acls, params, callback);
}, deprecatedMessage('client.addUserKeyWithValidity()', 'client.addApiKey()'));

/**
 * @deprecated Please use client.updateApiKey()
 */
AlgoliaSearch.prototype.updateUserKey = deprecate(function(key, acls, params, callback) {
  return this.updateApiKey(key, acls, params, callback);
}, deprecatedMessage('client.updateUserKey()', 'client.updateApiKey()'));

/**
 * Update an existing API key
 * @param {string} key - The key to update
 * @param {string[]} acls - The list of ACL for this key. Defined by an array of strings that
 *   can contains the following values:
 *     - search: allow to search (https and http)
 *     - addObject: allows to add/update an object in the index (https only)
 *     - deleteObject : allows to delete an existing object (https only)
 *     - deleteIndex : allows to delete index content (https only)
 *     - settings : allows to get index settings (https only)
 *     - editSettings : allows to change index settings (https only)
 * @param {Object} [params] - Optionnal parameters to set for the key
 * @param {number} params.validity - Number of seconds after which the key will be automatically removed (0 means no time limit for this key)
 * @param {number} params.maxQueriesPerIPPerHour - Number of API calls allowed from an IP address per hour
 * @param {number} params.maxHitsPerQuery - Number of hits this API key can retrieve in one call
 * @param {string[]} params.indexes - Allowed targeted indexes for this key
 * @param {string} params.description - A description for your key
 * @param {string[]} params.referers - A list of authorized referers
 * @param {Object} params.queryParameters - Force the key to use specific query parameters
 * @param {Function} callback - The result callback called with two arguments
 *   error: null or Error('message')
 *   content: the server answer with the modified API key
 * @return {Promise|undefined} Returns a promise if no callback given
 * @example
 * client.updateApiKey('APIKEY', ['search'], {
 *   validity: 300,
 *   maxQueriesPerIPPerHour: 2000,
 *   maxHitsPerQuery: 3,
 *   indexes: ['fruits'],
 *   description: 'Eat three fruits',
 *   referers: ['*.algolia.com'],
 *   queryParameters: {
 *     tagFilters: ['public'],
 *   }
 * })
 * @see {@link https://www.algolia.com/doc/rest_api#UpdateIndexKey|Algolia REST API Documentation}
 */
AlgoliaSearch.prototype.updateApiKey = function(key, acls, params, callback) {
  var isArray = require('isarray');
  var usage = 'Usage: client.updateApiKey(key, arrayOfAcls[, params, callback])';

  if (!isArray(acls)) {
    throw new Error(usage);
  }

  if (arguments.length === 2 || typeof params === 'function') {
    callback = params;
    params = null;
  }

  var putObj = {
    acl: acls
  };

  if (params) {
    putObj.validity = params.validity;
    putObj.maxQueriesPerIPPerHour = params.maxQueriesPerIPPerHour;
    putObj.maxHitsPerQuery = params.maxHitsPerQuery;
    putObj.indexes = params.indexes;
    putObj.description = params.description;

    if (params.queryParameters) {
      putObj.queryParameters = this._getSearchParams(params.queryParameters, '');
    }

    putObj.referers = params.referers;
  }

  return this._jsonRequest({
    method: 'PUT',
    url: '/1/keys/' + key,
    body: putObj,
    hostType: 'write',
    callback: callback
  });
};

/**
 * Initialize a new batch of search queries
 * @deprecated use client.search()
 */
AlgoliaSearch.prototype.startQueriesBatch = deprecate(function startQueriesBatchDeprecated() {
  this._batch = [];
}, deprecatedMessage('client.startQueriesBatch()', 'client.search()'));

/**
 * Add a search query in the batch
 * @deprecated use client.search()
 */
AlgoliaSearch.prototype.addQueryInBatch = deprecate(function addQueryInBatchDeprecated(indexName, query, args) {
  this._batch.push({
    indexName: indexName,
    query: query,
    params: args
  });
}, deprecatedMessage('client.addQueryInBatch()', 'client.search()'));

/**
 * Launch the batch of queries using XMLHttpRequest.
 * @deprecated use client.search()
 */
AlgoliaSearch.prototype.sendQueriesBatch = deprecate(function sendQueriesBatchDeprecated(callback) {
  return this.search(this._batch, callback);
}, deprecatedMessage('client.sendQueriesBatch()', 'client.search()'));

/**
 * Perform write operations accross multiple indexes.
 *
 * To reduce the amount of time spent on network round trips,
 * you can create, update, or delete several objects in one call,
 * using the batch endpoint (all operations are done in the given order).
 *
 * Available actions:
 *   - addObject
 *   - updateObject
 *   - partialUpdateObject
 *   - partialUpdateObjectNoCreate
 *   - deleteObject
 *
 * https://www.algolia.com/doc/rest_api#Indexes
 * @param  {Object[]} operations An array of operations to perform
 * @return {Promise|undefined} Returns a promise if no callback given
 * @example
 * client.batch([{
 *   action: 'addObject',
 *   indexName: 'clients',
 *   body: {
 *     name: 'Bill'
 *   }
 * }, {
 *   action: 'udpateObject',
 *   indexName: 'fruits',
 *   body: {
 *     objectID: '29138',
 *     name: 'banana'
 *   }
 * }], cb)
 */
AlgoliaSearch.prototype.batch = function(operations, callback) {
  var isArray = require('isarray');
  var usage = 'Usage: client.batch(operations[, callback])';

  if (!isArray(operations)) {
    throw new Error(usage);
  }

  return this._jsonRequest({
    method: 'POST',
    url: '/1/indexes/*/batch',
    body: {
      requests: operations
    },
    hostType: 'write',
    callback: callback
  });
};

// environment specific methods
AlgoliaSearch.prototype.destroy = notImplemented;
AlgoliaSearch.prototype.enableRateLimitForward = notImplemented;
AlgoliaSearch.prototype.disableRateLimitForward = notImplemented;
AlgoliaSearch.prototype.useSecuredAPIKey = notImplemented;
AlgoliaSearch.prototype.disableSecuredAPIKey = notImplemented;
AlgoliaSearch.prototype.generateSecuredApiKey = notImplemented;

function notImplemented() {
  var message = 'Not implemented in this environment.\n' +
    'If you feel this is a mistake, write to support@algolia.com';

  throw new errors.AlgoliaSearchError(message);
}
