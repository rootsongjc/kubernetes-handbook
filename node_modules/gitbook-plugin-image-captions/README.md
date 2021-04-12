# GitBook Image Captions Plugin

[![Build Status](https://travis-ci.org/todvora/gitbook-plugin-image-captions.svg?branch=master)](https://travis-ci.org/todvora/gitbook-plugin-image-captions)
[![Dependencies Status](https://david-dm.org/todvora/gitbook-plugin-image-captions/status.svg)](https://david-dm.org/todvora/gitbook-plugin-image-captions/)
[![DevDependencies Status](https://david-dm.org/todvora/gitbook-plugin-image-captions/dev-status.svg)](https://david-dm.org/todvora/gitbook-plugin-image-captions/#info=devDependencies)
[![npm version](https://badge.fury.io/js/gitbook-plugin-image-captions.svg)](https://badge.fury.io/js/gitbook-plugin-image-captions)

Add nice generated captions to your book images. This plugin converts ```alt``` or ```title``` attributes of your images into the captions. Works on both the GitBook website and your own generated book (pdf, mobi).

![rendered page](https://raw.github.com/todvora/gitbook-plugin-image-captions/master/preview.jpg)

## Online demo
→ http://tdvorak.gitbooks.io/test-book/content/phetchaburi.html

## Installation
In your book.json add the plugin:
```json
{
    "plugins": [
        "image-captions"
    ]
}
```

If you're building your book locally, download and prepare plugins by simply running ```gitbook install```.

## Configuration
The plugin provides reasonable defaults and configuration is not needed.
However, there are several config values you can use to adapt captions to your needs:

### Caption text

If you want to configure the caption text, you can provide your own template in the form:
```json
  "pluginsConfig": {
      "image-captions": {
          "caption": "Image - _CAPTION_"
      }
  }
```

The keyword ```_CAPTION_``` will be automatically replaced by the `title` or `alt` of your image
(the plugin uses first ```title```, if not found, then ```alt``` attribute).

### Page level and image number

Keywords ```_PAGE_LEVEL_```, ```_PAGE_IMAGE_NUMBER_``` and ```_BOOK_IMAGE_NUMBER_``` are available.

```json
  "pluginsConfig": {
      "image-captions": {
          "caption": "Image _PAGE_LEVEL_._PAGE_IMAGE_NUMBER_ - _CAPTION_"
      }
  }
```

Available variables in the caption text:

- ```_PAGE_LEVEL_```: for example ```1.2```. Follows chapters numbering.
- ```_PAGE_IMAGE_NUMBER_```: sequence number of the image in the chapter. First image in chapter gets value ```1```.
- ```_BOOK_IMAGE_NUMBER_```: sequence number of the image in the whole book. First image in book gets value ```1```.

### Text alignment
The image caption is by default aligned to the center. You can override this setting by providing a config property ```align``` with one of the values:

- ```left```
- ```right```

This will align the caption to the left:

```json
  "pluginsConfig": {
      "image-captions": {
          "align": "left"
      }
  }
```

### Image specific captions

You can set up caption template for a specific image by image level. Level is constructed from page level and image order so that on subpage 1.2 second image level is: ```1.2.2```. That can be used as an index on configuration:

```json
  "pluginsConfig": {
    "image-captions": {
      "images": {
        "1.2.2": {
          "caption": "This is a special image: _CAPTION_"
        }
      }
    }
  }
```

### Additional image attributes

Similarly, you can specify image tag attributes globally or at specific image levels:

```json
  "pluginsConfig": {
    "image-captions": {
      "attributes": { "width": "300" },
      "images": {
        "1.2.2": {
          "attributes": {
            "width": "400"
          }
        }
      }
    }
  }
```

### Skip selected images

You can specify which images should be skipped and not enriched by a figure caption:

```json
  "pluginsConfig": {
    "image-captions": {
      "images": {
        "1.2.2": {
          "skip": true
        }
      }
    }
  }
```

### Image list

As of version `0.3.0`, image list is available from book variables. You need to define a variable name:

```json
  "pluginsConfig": {
    "image-captions": {
      "variable_name": "pictures"
    }
  }
```

This will automatic add image container to the book variables, so that they are present on any page:
```json
    "variables": {
        "pictures": []
    }
```

Note: it is not necessary to add pictures entry on variables.  This is just to clarify usage of the image list. By defining ```variable_name```, you can make sure not to overwrite any previous book variable.

All images are available on any page. Say you have a ```pictures.md```, you can do:

```markdown
  # Pictures

  {% for picture in book.pictures %}
    1. [{{ picture.list_caption }}]({{ picture.backlink }})
  {% endfor %}
```

Image properties available in addition to ```list_caption``` and ```backlink``` are:

* **backlink**: link back to the image page containing anchor
* **list_caption**: image caption get from alt or title attribute and processed for list image label
* **index**: index of an image on a page aka. page wide image number
* **src**: image src attribute
* **key**: image key concatenated by ```page_level.index```
* **page_level**: page level of the image
* **caption**: image caption get from alt or title attribute
* **nro**: book wide image number

You can set a different caption (label) for each image on a list. This makes it possible to separate page image caption at the actual page from the label of the image on a picture list:

```json
  "pluginsConfig": {
    "image-captions": {
      "variable_name": "pictures",
      "list_caption": "List image _BOOK_IMAGE_NUMBER_: _CAPTION_"
    }
  }
```

You can set a specific image caption / label as well:

```json
  "pluginsConfig": {
    "image-captions": {
      "variable_name": "pictures",
      "images": {
        "1.2.2": {
          "list_caption": "Special list image _PAGE_LEVEL_._PAGE_IMAGE_NUMBER_: _CAPTION_"
        }
      }
    }
  }
```

## CSS Styles
This plugin generates simple ```figure``` around your images:
```html
<figure>
    <img src="../images/phetchaburi.jpg" alt="Phra Nakhon Khiri, Phetchaburi">
    <figcaption>Image - Phra Nakhon Khiri, Phetchaburi</figcaption>
</figure>
```

You can then customize CSS styles of the ```figure``` and ```figcaption```. By default, this definition is included in the plugin:

```css
figure {
    margin: 1.5em 0px;
    padding:10px 0;
}

figcaption {
    clear: left;
    margin: 0.75em 0px;
    text-align: center;
    font-style: italic;
    line-height: 1.5em;
}
```
You can attach your own styles by following the guide on [help.gitbook.com](http://help.gitbook.com/format/configuration.html).

First, you have to create your own css file - for example ```website.css```. Then add
your definitions of ```figure``` and ```caption```. You can change the text align, colors,
borders and so one. Last step is to attach your css style to the book. Open the ```book.json```
config file and modify it to look similar to this:

```json
{
  "plugins": [
    "image-captions"
  ],
  "pluginsConfig": {},
  "styles": {
    "website": "website.css"
  }
}
```


Different styles can be attached for
web and books, so you can style the captions differently for every medium:

```json
"styles": {
  "website": "website.css",
  "ebook": "ebook.css",
  "pdf":  "pdf.css",
  "mobi": "ebook.css",
  "epub": "ebook.css"
}
```

The same should apply for the online book editor on [gitbook.com](https://www.gitbook.com).

![Configuration of styles in book.json](https://raw.github.com/todvora/gitbook-plugin-image-captions/master/config.gif)


## Under the hood
This plugin attaches itself to the "page" event of GitBook generate task. It receives rendered HTML page of the chapter.
Then the plugin goes through the HTML code of the page, searching for images. If there is any image detected, containing also
```alt``` or ```title``` atribute, the plugin replaces image occurences with the ```figure``` tag, including original
image and additional ```figcaption``` tag with the text read from image attributes.

### Tests
Important part of this plugin is the test suite. You can run the test with command:
```
npm test
```

The test suite includes [JSHint](https://www.npmjs.com/package/jshint) validation of the plugin and test suite itself.
Then the [Mocha](https://mochajs.org/) integration tests are executed, validating expected plugin bahavior.
Integration tests use [gitbook-tester](https://www.npmjs.com/package/gitbook-tester).

The tests are executed with every pushed commit on the [Travis-CI server](https://travis-ci.org/todvora/gitbook-plugin-image-captions).

### Based on
This plugin is based on the example plugin from [GitbookIO/plugin](https://github.com/GitbookIO/plugin).

### Changes

#### 0.4.0
- Compatibility with Gitbook 3.x (while keeping also compatibility with 2.x releases of Gitbook) [#8](https://github.com/todvora/gitbook-plugin-image-captions/issues/8).

Thanks [@piranna](https://github.com/piranna) and [@SamyPesse](https://github.com/SamyPesse) for support.

#### 0.3.3 & 0.3.4
- Fixes for [#7](https://github.com/todvora/gitbook-plugin-image-captions/issues/7)

Thanks [@ghuntley](https://github.com/ghuntley) and [@aschempp](https://github.com/aschempp) for reports and verification.

#### 0.3.2
- Readme spelling and grammar fixes ([#5](https://github.com/todvora/gitbook-plugin-image-captions/pull/5))
- Fixed possible issue with processing pages (promises) ([#6](https://github.com/todvora/gitbook-plugin-image-captions/issues/6))

Thanks [@klauern](https://github.com/klauern) for #5 and [@markomanninen](https://github.com/markomanninen) for #6

#### 0.3.1
- Fixed figure inside a link ([#4](https://github.com/todvora/gitbook-plugin-image-captions/issues/4))

Thanks [@michaellwest](https://github.com/michaellwest) for reporting this issue!


#### 0.3.0
- added support for book wide and page wide image numbering
- added support for image specific caption and attribute configuration
- added support for image list construction by book variables
- new template keywords: ```_PAGE_LEVEL_```, ```_PAGE_IMAGE_NUMBER_```, ```_BOOK_IMAGE_NUMBER_ ```in addition to ```_CAPTION_```

Thanks [@markomanninen](https://github.com/markomanninen) for all new features!

#### 0.2.0
 - Paragraphs and inline image

Thanks [@aschempp](https://github.com/aschempp) for PR [#1](https://github.com/todvora/gitbook-plugin-image-captions/pull/1) and new test cases!

#### 0.1.0
- figcaption text-align configurable

#### 0.0.2 - 0.0.6
- dependencies fix
- dependencies cleanup, readme update
- npmignore configuration
- integration with coverage tools, readme, code cleanup
- initial commit
