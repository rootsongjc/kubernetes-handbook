
/**
 * 处理默认参数
 * @param defaultOption
 * @param configOption
 */
function handlerOption(defaultOption, configOption) {
    if (configOption) {
        for (var item in defaultOption) {
            if (item in configOption) {
                defaultOption[item] = configOption[item];
            }
        }
    }
}

function start(bookIns, page) {
    const defaultOption = {
        copyright: 'for GitBook.',
        update_label: 'update : ',
        update_format: 'YYYY-MM-DD HH:mm:ss'
    }
    /**
     * [configOption: config option]
     * @type {Object}
     */
    var configOption = bookIns.config.get('pluginsConfig')['page-footer-ex'];
    // 处理配置参数
    handlerOption(defaultOption, configOption);

    var _copy = '<span class="page-footer-ex-copyright">' + defaultOption.copyright + '</span>'
    var wrap = ' \n\n' +
        '<footer class="page-footer-ex"> ' +
                _copy +
            '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
            '<span class="page-footer-ex-footer-update">' + defaultOption.update_label +
                '\n{{ file.mtime | dateFormat("' + defaultOption.update_format + '") }}\n' +
            '</span>' +
        '</footer>'
    page.content = page.content + wrap;
}

module.exports = start;
