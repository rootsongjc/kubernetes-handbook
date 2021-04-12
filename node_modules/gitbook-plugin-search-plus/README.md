# gitbook-search-plus

A powerful search plugin for GitBook.

### Features

    * Search any character
    * Search across element (for search code)
    * Remember search url

### Use this plugin

 Before use this plugin, you should disable the default search plugin first, 
 Here is a `book.json` configuration example:

```
{
    plugins: ["-lunr", "-search", "search-plus"]
}
```

> Note: Only gitbook >= 3.0.0 support

### Examples

[![](https://github.com/lwdgit/gitbook-plugin-search-plus/raw/master/search.gif)](https://lwdgit.github.io/gitbook-plugin-search-plus/)
[![](https://github.com/lwdgit/gitbook-plugin-search-plus/raw/master/search2.gif)](https://lwdgit.github.io/gitbook-plugin-search-plus/)
[![](https://github.com/lwdgit/gitbook-plugin-search-plus/raw/master/search3.gif)](https://lwdgit.github.io/gitbook-plugin-search-plus/book/?q=%E8%BF%99%E6%9C%AC%E5%B0%8F%E4%B9%A6%E7%9A%84%E7%9B%AE%E7%9A%84%E6%98%AF%E5%BC%95%E5%AF%BC%E4%BD%A0%E8%BF%9B%E5%85%A5%20React%20%E5%92%8C%20Webpack%20%E7%9A%84%E4%B8%96%E7%95%8C)


Open [https://lwdgit.github.io/gitbook-plugin-search-plus/](https://lwdgit.github.io/gitbook-plugin-search-plus/book/?q=%E8%BF%99%E6%9C%AC%E5%B0%8F%E4%B9%A6%E7%9A%84%E7%9B%AE%E7%9A%84%E6%98%AF%E5%BC%95%E5%AF%BC%E4%BD%A0%E8%BF%9B%E5%85%A5%20React%20%E5%92%8C%20Webpack%20%E7%9A%84%E4%B8%96%E7%95%8C) or test it by yourself

```
    > git clone git@github.com:lwdgit/gitbook-plugin-search-plus.git -b gh-pages
    > cd gitbook-plugin-search-plus
    > npm install
    > npm start
```

And then open http://127.0.0.1:4000

### Thanks To:

* [gitbook-plugin-lunr](https://github.com/GitbookIO/plugin-lunr)
* [gitbook-plugin-search](https://github.com/GitbookIO/plugin-search)
* [mark.js](https://github.com/julmot/mark.js)
