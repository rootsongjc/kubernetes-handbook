Google Adsense for GitBook
==============

You can use install it via **NPM**:

```
$ npm install gitbook-plugin-adsense
```

And use it for your book with in the book.json:

```
{
  "plugins": ["adsense"]
}
```

You can set the Google Adsense client and slot keys using the plugins configuration in the book.json:

```
{
    "plugins": ["adsense"],
    "pluginsConfig": {
      "adsense": {
        "client": "ca-pub-XXXXXXXXXXXXXXXX",
        "slot": "XXXXXXXXXX",
        "format": "auto",
        "element": ".page-inner section",
        "position": "top"
      }
    }
}
```
Allowed positions are `top` and `bottom` (default)
