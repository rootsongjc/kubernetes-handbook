var $ = require('jquery');

var events  = require('./events');
var storage = require('./storage');
var page = require('./page');

var isPageReady = false;
var onLoad = window.gitbook || [];

// Export APIs for plugins
var gitbook = {
    events:   events,
    page:     page,

    // Deprecated
    state:    page.getState(),

    // Read/Write the localstorage
    storage: storage,

    // Push a function to be called once gitbook is ready
    push: function(fn) {
        if (!isPageReady) onLoad.push(fn);
        else fn();
    }
};


// Modules mapping for plugins
var MODULES = {
    'gitbook': gitbook,
    'jquery':  $
};

window.gitbook = gitbook;
window.$ = $;
window.jQuery = $;
window.require = function(mods, fn) {
    mods = mods.map(function(mod) {
        mod = mod.toLowerCase();
        if (!MODULES[mod]) {
            throw new Error('GitBook module '+mod+' doesn\'t exist');
        }

        return MODULES[mod];
    });

    fn.apply(null, mods);
};

$(document).ready(function() {
    isPageReady = true;

    // Call pile of function once GitBook is ready
    $.each(onLoad, function(i, fn) {
        fn();
    });
});


