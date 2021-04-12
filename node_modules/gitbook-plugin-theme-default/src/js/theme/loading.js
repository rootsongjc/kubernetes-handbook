var gitbook = window.gitbook;

function showLoading(p) {
    gitbook.state.$book.addClass('is-loading');
    p.always(function() {
        gitbook.state.$book.removeClass('is-loading');
    });

    return p;
}

module.exports = {
    show: showLoading
};
