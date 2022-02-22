var baseKey = '';

/*
 * Simple module for storing data in the browser's local storage
 */
module.exports = {
    setBaseKey: function(key) {
        baseKey = key;
    },

    // Write something in localstorage
    set: function(key, value) {
        key = baseKey+':'+key;

        try {
            localStorage[key] = JSON.stringify(value);
        } catch(e) {}   // eslint-disable-line no-empty
    },

    // Read a value from localstorage
    get: function(key, def) {
        var value;
        key = baseKey+':'+key;
        // We need a try block here because window.localStorage is
        // inaccessible when browser cookies are disabled.
        try {
            value = localStorage[key];
        } catch(e) {}   // eslint-disable-line no-empty

        if (value === undefined) return def;

        try {
            var parsed = JSON.parse(value);
            return parsed == null ? def : parsed;
        } catch(err) {
            return value || def;
        }
    },

    // Remove a key from localstorage
    remove: function(key) {
        key = baseKey+':'+key;
        try {
            localStorage.removeItem(key);
        } catch(e) {}   // eslint-disable-line no-empty
    }
};
