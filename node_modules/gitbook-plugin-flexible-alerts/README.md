# GitBook plugin: Flexible Alerts

![Build Status](https://api.travis-ci.org/zanfab/gitbook-plugin-flexible-alerts.svg)
[![npm version](https://img.shields.io/npm/v/gitbook-plugin-flexible-alerts/latest.svg)](https://www.npmjs.com/package/gitbook-plugin-flexible-alerts)
[![npm Downloads](https://img.shields.io/npm/dt/gitbook-plugin-flexible-alerts.svg)](https://www.npmjs.com/package/gitbook-plugin-flexible-alerts)

This GitBook plugin converts blockquotes into beautiful alerts. Look and feel can be configured on a global as well as on a alert specific level so output does fit your needs (some examples are shown below). In addition, you can provide own alert types.

![Sample alerts created with plugin 'flexible-alerts'](https://user-images.githubusercontent.com/44210522/50688702-ea774f00-1026-11e9-9281-ca615cb466f5.jpg)

## Installation

### Step #1 - Update book.json file

1. In you gitbook's book.json file, add `flexible-alerts` to plugins list.
2. In pluginsConfig, configure the plugin so it does fit your needs. A custom setup is not mandatory.
3. By default style 'callout' and headings 'Note', 'Tip', 'Warning', 'Attention' will be used. You can change it using plugin configuration via `book.json` or for a single alert in your markdown files.

**Sample `book.json` file for gitbook version 2.0.0+**

```json
{
  "plugins": [
    "flexible-alerts"
  ]
}
```

**Sample `book.json` file for gitbook version 2.0.0+ and style `flat` instead of `callout`**

```json
{
  "plugins": [
    "flexible-alerts"
  ],
  "pluginsConfig": {
    "flexible-alerts": {
      "style": "flat"
    }
  }
}
```

**Sample `book.json` file for gitbook version 2.0.0+ and custom headings**

```json
{
  "plugins": [
    "flexible-alerts"
  ],
  "pluginsConfig": {
    "flexible-alerts": {
      "note": {
        "label": "Hinweis"
      },
      "tip": {
        "label": "Tipp"
      },
      "warning": {
        "label": "Warnung"
      },
      "danger": {
        "label": "Achtung"
      }
    }
  }
}
```

**Sample `book.json` file for gitbook version 2.0.0+  and multilingual headings**

```json
{
  "plugins": [
    "flexible-alerts"
  ],
  "pluginsConfig": {
    "flexible-alerts": {
      "note": {
        "label": {
          "de": "Hinweis",
          "en": "Note"
        }
      },
      "tip": {
        "label": {
          "de": "Tipp",
          "en": "Tip"
        }
      },
      "warning": {
        "label": {
          "de": "Warnung",
          "en": "Warning"
        }
      },
      "danger": {
        "label": {
          "de": "Achtung",
          "en": "Attention"
        }
      }
    }
  }
}
```

Note: Above snippets can be used as complete `book.json` file, if one of these matches your requirements and your book doesn't have one yet.

### Step #2 - gitbook commands

1. Run `gitbook install`. It will automatically install `flexible-alerts` gitbook plugin for your book. This is needed only once.
2. Build your book (`gitbook build`) or serve (`gitbook serve`) as usual.

## Usage

To use the plugin just modify an existing blockquote and prepend a line matching pattern `[!type]`. By default types `NOTE`, `TIP`, `WARNING` and `DANGER` are supported. You can extend the available types by providing a valid configuration (see below for an example).

```markdown
> [!NOTE]
> An alert of type 'note' using global style 'callout'.
```

```markdown
> [!NOTE|style:flat]
> An alert of type 'note' using alert specific style 'flat' which overrides global style 'callout'.
```

As you can see in the second snippet, output can be configured on alert level also. Supported options are listed in following table:

| Key            | Allowed value |
| --------------- | ---- |
| style | One of follwowing values: callout, flat |
| label  | Any text |
| icon  | A valid Font Awesome icon, e.g. 'fa fa-info-circle' |
| className  | A name of a CSS class which specifies the look and feel |
| labelVisibility | One of follwowing values: visible (default), hidden |
| iconVisibility  | One of follwowing values: visible (default), hidden |

Multiple options can be used for single alerts as shown below:

```markdown
> [!TIP|style:flat|label:My own heading|iconVisibility:hidden]
> An alert of type 'tip' using alert specific style 'flat' which overrides global style 'callout'.
> In addition, this alert uses an own heading and hides specific icon.
```

![Custom alert](https://user-images.githubusercontent.com/44210522/50689970-04676080-102c-11e9-9cbc-8af129cb988c.png)

As mentioned above you can provide your own alert types. Therefore, you have to provide the type configuration via `book.json`. Following example shows an additional type `COMMENT`.

```json
{
  "plugins": [
    "flexible-alerts"
  ],
  "pluginsConfig": {
    "flexible-alerts": {
      "style": "callout",
      "comment": {
        "label": "Comment",
        "icon": "fa fa-comments",
        "className": "info"
      }
    }
  }
}
```

In Markdown just use the alert according to the types provided by default.

```markdown
> [!COMMENT]
> An alert of type 'comment' using style 'callout' with default settings.
```

![Custom alert type 'comment'](https://user-images.githubusercontent.com/44210522/50722960-6f21a600-10d7-11e9-87e7-d40d87045afe.png)

## Troubleshooting

If alerts do not look as expected, check if your `book.json` as well as alerts in Markdown are valid according to this documentation.

## Changelog

04/08/2019 - Fixed issue concerning languages using characters others than [a-z,A-Z,0-9] like Chinese or Russian.

02/24/2019 - Added support for Internet Explorer 11

01/07/2019 - Moved complete icon definition to pluginsConfig section

01/05/2019 - Initial Release