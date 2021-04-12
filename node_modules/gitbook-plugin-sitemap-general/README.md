# Sitemap for GitBook

[![npm](https://img.shields.io/npm/v/gitbook-plugin-sitemap-general.svg)](https://www.npmjs.com/package/gitbook-plugin-sitemap-general)
[![npm](https://img.shields.io/npm/dt/gitbook-plugin-sitemap-general.svg)](https://www.npmjs.com/package/gitbook-plugin-sitemap-general)
[![npm](https://img.shields.io/npm/l/gitbook-plugin-sitemap-general.svg)](https://www.npmjs.com/package/gitbook-plugin-sitemap-general)

Generate a sitemap for the gitbook website in `./sitemap.xml`.

Instead of using only the hostname part of the given config, this plugin uses the prefix of the urls.

Add it to your `book.json` with a basic configuration:

```js
{
    "plugins": ["sitemap-general"],
    "pluginsConfig": {
        "sitemap-general": {
            "prefix": "https://cyberzhg.gitbooks.io/clrs/content/"
        }
    }
}
```
