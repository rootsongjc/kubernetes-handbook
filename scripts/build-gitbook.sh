#!/bin/bash
gitbook install
gitbook install sitemap-general
gitbook build
cp images/apple-touch-icon-precomposed-152.png _book/gitbook/images
