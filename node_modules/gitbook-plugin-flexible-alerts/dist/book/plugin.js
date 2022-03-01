/*!
 * gitbook-plugin-flexible-alerts
 * v1.0.3
 * https://github.com/zanfab/gitbook-plugin-flexible-alerts#readme
 * (c) 2019 Fabian Zankl
 * MIT license
 */
"use strict";function _typeof(t){return(_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function findAlertSetting(t,n,e,i){var o=(t||"").match(new RegExp("".concat(n,":(([^\\r\\n|]*))")));return o?i?i(o[1]):o[1]:i?i(e):e}require(["gitbook","jQuery"],function(p,e){p.events.bind("page.change",function(){var b=p.state.config.pluginsConfig["flexible-alerts"];e("blockquote").each(function(){var t=e(this).html(),n=t.replace(/\[!(\w*)((?:\|\w*:.*)*?)\]([\s\S]*)/g,function(t,n,e,i){var o=b[n.toLowerCase()];if(!o)return t;var r=findAlertSetting(e,"style",b.style),c=findAlertSetting(e,"iconVisibility","visible",function(t){return"hidden"!==t}),l=findAlertSetting(e,"labelVisibility","visible",function(t){return"hidden"!==t}),a=findAlertSetting(e,"label",o.label),f=findAlertSetting(e,"icon",o.icon),s=findAlertSetting(e,"className",o.className);if("object"===_typeof(a)){var u=p.state.innerLanguage;u&&a.hasOwnProperty(u)?a=a[u]:c=l=!1}var y='<i class="'.concat(f,'"></i>');return'<div class="alert '.concat(r," ").concat(s,'">\n              <p class="title">\n                  ').concat(c?y:"","\n                  ").concat(l?a:"","\n              </p>\n              <p>").concat(i,"\n            </div>")});n!==t&&e(this).replaceWith(n)})})});
//# sourceMappingURL=plugin.js.map
