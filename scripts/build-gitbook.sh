#!/bin/bash
#gitbook install
gitbook build
rm -rf _book/images
cp images/apple-touch-icon-precomposed-152.png _book/gitbook/images
cp -r images _book/
