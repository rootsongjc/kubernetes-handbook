"use strict";

var cheerio = require('cheerio');

var uuid = require('uuid/v4');

var pageUuid = 0;
var lightboxConfig = {};

var generateLightBoxByElement = function generateLightBoxByElement(img) {
  var imgUuid = pageUuid;

  if (lightboxConfig.sameUuid !== true) {
    imgUuid = uuid();
  }

  return generateLightBoxItem(img.attr('src'), imgUuid, img.attr('alt'));
};

var generateLightBoxItem = function generateLightBoxItem(url, groupName, title) {
  return "<a href=\"".concat(url, "\" data-lightbox=\"").concat(groupName, "\" data-title=\"").concat(title, "\"><img src=\"").concat(url, "\" alt=\"").concat(title, "\"></a>");
};

var getAssets = function getAssets() {
  var assets = {
    assets: './dist/assets',
    js: ['js/lightbox.min.js'],
    css: ['css/lightbox.min.css']
  };

  if (Object.prototype.hasOwnProperty.call(lightboxConfig, 'includeJquery') && lightboxConfig.includeJquery !== false) {
    assets.js.push('js/jquery.slim.min.js');
  }

  return assets;
};

var generateLightboxConfigScript = function generateLightboxConfigScript() {
  if (!Object.prototype.hasOwnProperty.call(lightboxConfig, 'options')) {
    return '';
  }

  return "<script>document.addEventListener(\"DOMContentLoaded\", function() {lightbox.option(".concat(JSON.stringify(lightboxConfig.options), ");})</script>");
};

module.exports = {
  book: getAssets(),
  blocks: {
    lightbox: {
      process: function process(block) {
        var arg = {
          url: block.kwargs.url,
          groupName: block.kwargs.groupName || lightboxConfig.sameUuid !== true ? uuid() : pageUuid,
          title: block.kwargs.title || "Image"
        };
        return generateLightBoxItem(arg.url, arg.groupName, arg.title);
      }
    }
  },
  hooks: {
    init: function init() {
      lightboxConfig = this.config.get('pluginsConfig.lightbox');

      if (!Object.prototype.hasOwnProperty.call(lightboxConfig, 'sameUuid')) {
        lightboxConfig.sameUuid = false;
      }
    },
    page: function page(_page) {
      var $ = cheerio.load(_page.content);
      pageUuid = uuid();
      $('img').each(function (index, img) {
        var target = $(img);
        target.replaceWith(generateLightBoxByElement(target));
      });
      _page.content = $('body').html();
      _page.content += generateLightboxConfigScript();
      return _page;
    }
  }
};