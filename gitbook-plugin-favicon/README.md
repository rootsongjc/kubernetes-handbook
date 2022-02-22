# gitbook-plugin-favicon

This plugin adds an the favicon & Apple Touch Icon to your website.

## How to use it?

Add it to your `book.json` configuration:

```json
{
    "plugins": ["favicon"]
}
```

Install your plugins using:

```bash
$ gitbook install
```

## Configuration

```json
"pluginsConfig": {
    "favicon":{
        "shortcut": "assets/images/favicon.ico",
        "bookmark": "assets/images/favicon.ico",
        "appleTouch": "assets/images/apple-touch-icon.png",
        "appleTouchMore": {
            "120x120": "assets/images/apple-touch-icon-120x120.png",
            "180x180": "assets/images/apple-touch-icon-180x180.png",
        }
    }
}
```

# License

MIT
