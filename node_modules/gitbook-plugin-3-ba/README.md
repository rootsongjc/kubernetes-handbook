Google Analytics tracking for GitBook
==============

You can use install it via **NPM**:

```
$ npm install gitbook-plugin-3-ga
```

And use it for your book with in the book.json:

```
{
    "plugins": ["3-ba"]
}
```

You can set the Google Analytics tracking ID using the plugins configuration in the book.json:

```
{
    "plugins": ["3-ba"],
    "pluginsConfig": {
        "3-ba": {
            "token": "xxxxxxxx"
        }
    }
}
```

For an overview of all available configuration parameters, please refer to the [analytics.js field reference](https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#create).
