// LICENSE : MIT
"use strict";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

require(['gitbook'], function (gitbook) {
    function addBeforeHeader(element) {
        jQuery('.book-header > h1').before(element);
    }

    function createButton(_ref) {
        var user = _ref.user;
        var repo = _ref.repo;
        var type = _ref.type;
        var size = _ref.size;
        var width = _ref.width;
        var height = _ref.height;
        var count = _ref.count;

        var extraParam = type === "watch" ? "&v=2" : "";
        return '<a class="btn pull-right hidden-mobile" aria-label="github">\n        <iframe style="display:inline-block;vertical-align:middle;" src="https://ghbtns.com/github-btn.html?user=' + user + '&repo=' + repo + '&type=' + type + '&count=' + count + '&size=' + size + extraParam + '" frameborder="0" scrolling="0" width="' + width + 'px" height="' + height + 'px"></iframe>\n        </a>';
    }

    function insertGitHubLink(_ref2) {
        var user = _ref2.user;
        var repo = _ref2.repo;
        var types = _ref2.types;
        var size = _ref2.size;
        var width = _ref2.width;
        var height = _ref2.height;
        var count = _ref2.count;

        types.reverse().forEach(function (type) {
            var elementString = createButton({
                user: user,
                repo: repo,
                type: type,
                size: size,
                width: width,
                height: height,
                count: count
            });
            addBeforeHeader(elementString);
        });
    }

    function init(config) {
        var repoPath = config.repo;

        var _repoPath$split = repoPath.split("/");

        var _repoPath$split2 = _slicedToArray(_repoPath$split, 2);

        var user = _repoPath$split2[0];
        var repo = _repoPath$split2[1];

        if (repoPath == null) {
            console.log("Should set github.repo");
            return;
        }
        var types = config.types || ["star", "watch"];
        var size = config.size || "large";
        var width = config.width || (size === "large" ? "150" : "100");
        var height = config.height || (size === "large" ? "30" : "20");
        var count = typeof config.count === "undefined" ? "true" : "false";
        insertGitHubLink({
            user: user,
            repo: repo,
            types: types,
            size: size,
            width: width,
            height: height,
            count: count
        });
    }

    // injected by html hook
    function getPluginConfig() {
        return window["gitbook-plugin-github-buttons"];
    }

    // make sure configuration gets injected
    gitbook.events.bind('start', function (e, config) {
        window["gitbook-plugin-github-buttons"] = config["github-buttons"];
    });

    gitbook.events.bind('page.change', function () {
        init(getPluginConfig());
    });
});
//# sourceMappingURL=plugin.js.map