
var toSpace = require('to-space-case')

/**
 * Export.
 */

module.exports = toSnakeCase

/**
 * Convert a `string` to snake case.
 *
 * @param {String} string
 * @return {String}
 */

function toSnakeCase(string) {
  return toSpace(string).replace(/\s/g, '_')
}
