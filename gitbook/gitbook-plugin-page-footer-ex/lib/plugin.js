module.exports = function(book, page) {
    /**
     * 在package.json中配置的默认值，这里可以直接使用
     * [config: config option]
     * @type {Object}
     */
    var config = book.config.get('pluginsConfig')['page-footer-ex'];

    var wrapIfMarkdown = function(input) {
        if (!config.markdown) {
            return input;
        } else {
            return book.renderInline('markdown', input);
        }
    }
    // Gitbook Markdown rendering is asynchronous.
    return Promise.all([wrapIfMarkdown(config.copyright), wrapIfMarkdown(config.update_label)])
        .then(function(labels) {
            var copyright = labels[0];
            var updateLabel = labels[1];
            page.content += '\n\n' + [
                '<footer class="page-footer-ex">',
                    '<span class="page-footer-ex-copyright">',
                        copyright,
                    '</span>',
                    '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<span class="page-footer-ex-footer-update">',
                        updateLabel,
                        '{{ file.mtime | dateFormat("' + config.update_format + '") }}',
                    '</span>',
                '</footer>'
            ].join(' ');
            return page;
        });
}
