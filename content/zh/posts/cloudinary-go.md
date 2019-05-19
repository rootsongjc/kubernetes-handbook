---
title: "Cloudinary Go"
date: 2017-10-29T15:24:19+08:00
subtitle: "A Go client library and CLI tool to upload static assets to Cloudinary service"
draft: false
description: "Cloudinary-go is a Go client library and CLI tool to upload static assets to Cloudinary service"
tags: ["go","code","cloudinary"]
categories: "github"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20171014010.jpg", desc: "Beijing Capital Airport Oct 14,2017"}]
---

[Cloudinary-go](https://github.com/rootsongjc/cloudinary-go) is a Go client library and CLI tool to upload static assets to the [Cloudinary](http://www.cloudinary.com) service.

## Installation

Install the CLI tool and the library with:

```bash
go get github.com/rootsongjc/cloudinary-go/cloudinary
```

Or download the release binary from [release](https://github.com/rootsongjc/cloudinary-go/releases).

## Configuration

Create a default configuration file named `${HOME}/.cloudinary.toml` 

```tom
[cloudinary]
uri=cloudinary://api_key:api_secret@cloud_name # check your cloudinary dashboard to the the uri
prepend = "images" # default cloudinary folder
```

## Usage

```bash
A CLI tool to upload static assets to the Cloudinary service.

Usage:
  cloudinary [command]

Available Commands:
  help        Help about any command
  ls          List files
  put         Upload file
  rm          Remove file

Flags:
      --config string   config file (default is $HOME/.cloudinary.toml)
  -h, --help            help for cloudinary
  -i, --image string    image filename or public id
  -p, --path string     flle prepend path
  -r, --raw string      raw filename or public id
  -s, --simulate        simulate, do nothing (dry run)
  -v, --verbose         verbose output

Use "cloudinary [command] --help" for more information about a command.
```

Type ``cloudinary`` in the terminal to get some help.

### Upload

```bash
# upload image file
cloudinary put -i abc.jpg -p images
# upload raw file
cloudinary put -r abc.js -p js
```

As the local image uploaded to cloudinary, you will get a URL such like this:

```bash
cloudinary put -i cover.jpg
Using config file: /Users/jimmy/.cloudinary.toml
Warning: database not set (upload sync disabled)
Default remote prepend path set to:  images/
==> PublicID: images/cover
==> Uploading as images
2017/10/29 14:49:01 Uploading: cover.jpg
2017/10/29 14:49:06 URL: https://res.cloudinary.com/jimmysong/image/upload/images/cover.jpg
```

The URL `https://res.cloudinary.com/jimmysong/image/upload/images/cover.jpg` represent the laster version of the image.

You can use `ls` to get the upload version.

### List

```bash
# list all resources
cloudinary ls
# list specified static file details
cloudinary ls -i abc -p images
```

List raw file details not support.

Get the upload version.

```bash
cloudinary ls -i cover.jpg
Using config file: /Users/jimmy/.cloudinary.toml
Warning: database not set (upload sync disabled)
Default remote prepend path set to:  images/
==> PublicID: images/cover
==> Image Details:
public_id                      Format Version    Type  Size(KB) Width  Height Url
images/cover                   jpg    1509259745 image 297      1800   2360   http://res.cloudinary.com/jimmysong/image/upload/v1509259745/images/cover.jpg
```

**Note**: Whether You can specify the file name with extension name or not, that also works.

### Delete

```bash
# delete image
cloudinary delete -i abc -p images
# delete raw resource
cloudinary delete -r abc.js -p js
```

## Note

1. Cloudinary prepend path should not start with  a "/" root path

### PublicID

1. PublicID of **Image resource** doesn't include their extension name
2. PublicID of **Raw resource** include their extension name
3. PublicID includes the prepend path

**PublicID example**

| Local file | Prepend path | PublicID   |
| ---------- | ------------ | ---------- |
| abc.jpg    | images       | images/abc |
| abc.js     | js           | js/abc.js  |

More information see [Cloudinary Image upload API reference](https://cloudinary.com/documentation/image_upload_api_reference)