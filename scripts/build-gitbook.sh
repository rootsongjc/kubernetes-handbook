#!/bin/bash
gitbook install
# install sitemap-gerneral gitbook plugin
npm install -g gitbook-plugin-sitemap-general
gitbook build
cp images/apple-touch-icon-precomposed-152.png _book/gitbook/images
