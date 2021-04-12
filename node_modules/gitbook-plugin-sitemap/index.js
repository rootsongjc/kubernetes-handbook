var fs = require('fs');
var path = require('path');
var url = require('url');
var sm = require('sitemap');

var urls = [];

module.exports = {
    hooks: {
        // Index page
        "page": function(page) {
            if (this.options.generator == 'website') {
                urls.push({
                    url: this.contentPath(page.path)
                });
            }

            return page;
        },

        // Write sitemap.xml
        "finish": function() {
            if (this.options.generator != 'website') return;
            if (!this.config.options.pluginsConfig.sitemap
            || !this.config.options.pluginsConfig.sitemap.hostname) {
                throw "Need a 'hostname' configuration for sitemap generation";
            }

            var sitemap = sm.createSitemap({
                cacheTime: 600000,
                hostname: url.resolve(this.config.options.pluginsConfig.sitemap.hostname, '/'),
                urls: urls
            });

            var xml = sitemap.toString();
            fs.writeFileSync(
                path.resolve(this.options.output, 'sitemap.xml'),
                xml
            );
        }
    }
};
