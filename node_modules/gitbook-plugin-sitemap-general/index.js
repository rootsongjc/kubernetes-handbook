/*jslint node*/
var url = require('url');
var sm = require('sitemap');

var urls = [];

module.exports = {
    hooks: {
        "page": function (page) {
            'use strict';
            if (this.output.name !== 'website') {
                return page;
            }

            var lang = this.isLanguageBook() ? this.config.values.language : '';
            if (lang) {
                lang = lang + '/';
            }

            urls.push({
                url: this.output.toURL(lang + page.path)
            });

            return page;
        },

        "finish": function () {
            'use strict';
            var prefix = this.config.get('pluginsConfig.sitemap-general.prefix'),
                sitemap = sm.createSitemap({
                    cacheTime: 600000,
                    urls: urls.map(function (obj) {
                        return {
                            url: url.resolve(prefix, obj.url)
                        };
                    })
                });

            var xml = sitemap.toString();

            return this.output.writeFile('sitemap.xml', xml);
        }
    }
};
