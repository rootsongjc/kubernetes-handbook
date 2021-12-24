#!/bin/bash
#gitbook install
gitbook build
rm _book/images/*
cp images/apple-touch-icon-precomposed-152.png _book/gitbook/images
cp images/* _book/gitbook/images/
