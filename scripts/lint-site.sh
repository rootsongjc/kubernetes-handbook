#!/bin/bash
hugo
echo -ne "mdspell "
mdspell --version
echo -ne "mdl "
mdl --version
htmlproofer --version
htmlproofer ./public --assume-extension --check-opengraph --alt-ignore '/.*/' --timeframe 2d --storage-dir .htmlproofer --url-ignore "/localhost/,/groups.google.com/forum/,/google.com/,/twitter.com/,/facebook.com/,/ws4.sinaimg.cn/,/ws3.sinaimg.cn/,/ws2.sinaimg.cn/,/ws1.sinaimg.cn/,/zh.wikipedia.org/,/thenewstack.com/"
