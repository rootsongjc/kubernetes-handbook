var $ = require('jquery');

module.exports = {
    isMobile: function() {
        return ($(document).width() <= 600);
    },
    // Breakpoint for navigation links position
    isSmallScreen: function() {
        return ($(document).width() <= 1240);
    }
};
