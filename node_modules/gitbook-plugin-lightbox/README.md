# gitbook-plugin-lightbox
 A gitbook plugin to show image by lightbox

## Requirement
-  Gitbook >= 3.0.0

## Installation
Add the below to your book.json file, then run gitbook install :
```json
{
  "plugins": ["lightbox"]
}
```

## Usage
Just add image as normal, this plugin will do all things for you.

## Config
There are something you can tweak!

### jQuery
If you have already include jQuery in other place, you can set:
```json
{
  "pluginsConfig": {
    "lightbox": {
      "includeJQuery": false
    }
  }
}

```
### Same lightbox id
If you want to use next/prev button, you can set:
```json
{
  "pluginsConfig": {
    "lightbox": {
      "sameUuid": true
    }
  }
}
```

### Lightbox original configuration
If you want to set [lightbox configration](https://lokeshdhakar.com/projects/lightbox2/#options), yo can set:
```json
{
  "pluginsConfig": {
    "lightbox": {
      "options": {
        "resizeDuration": 200,
        "wrapAround": true
      }
    }
  }
}
```
