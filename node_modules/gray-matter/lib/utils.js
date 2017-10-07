'use strict';

var stripBom = require('strip-bom-string');
var utils = module.exports = exports;
utils.typeOf = require('kind-of');

/**
 * Returns true if `val` is a buffer
 */

utils.isBuffer = function(val) {
  return utils.typeOf(val) === 'buffer';
};

/**
 * Returns true if `val` is an object
 */

utils.isObject = function(val) {
  return utils.typeOf(val) === 'object';
};

/**
 * Cast `input` to a buffer
 */

utils.toBuffer = function(input) {
  if (typeof input === 'string') {
    return new Buffer(input);
  }
  return input;
};

/**
 * Cast `val` to a string.
 */

utils.toString = function(input) {
  if (utils.isBuffer(input)) {
    return stripBom(String(input));
  }
  if (typeof input !== 'string') {
    throw new TypeError('expected input to be a string or buffer');
  }
  return stripBom(input);
};

/**
 * Cast `val` to an array.
 */

utils.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

/**
 * Returns true if `str` starts with `substr`.
 */

utils.startsWith = function(str, substr, len) {
  if (typeof len !== 'number') len = substr.length;
  return str.slice(0, len) === substr;
};
