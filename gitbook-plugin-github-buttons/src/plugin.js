// LICENSE : MIT
"use strict";
require(['gitbook'], function (gitbook) {
    function addBeforeHeader(element) {
        jQuery('.book-header > h1').before(element)
    }

    function createButton({
        user,
        repo,
        type,
        size,
        width,
        height,
        count
        }) {
        var extraParam = type === "watch" ? "&v=2" : "";
        return `<a class="btn pull-right hidden-mobile" aria-label="github">
        <iframe style="display:inline-block;vertical-align:middle;" src="https://ghbtns.com/github-btn.html?user=${user}&repo=${repo}&type=${type}&count=${count}&size=${size}${extraParam}" frameborder="0" scrolling="0" width="${width}px" height="${height}px"></iframe>
        </a>`;
    }


    function insertGitHubLink({
        user,
        repo,
        types,
        size,
        width,
        height,
        count
        }) {
        types.reverse().forEach(type => {
            var elementString = createButton({
                user,
                repo,
                type,
                size,
                width,
                height,
                count
            });
            addBeforeHeader(elementString);
        });
    }

    function init(config) {
        var repoPath = config.repo;
        var [user, repo] = repoPath.split("/");
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
            user,
            repo,
            types,
            size,
            width,
            height,
            count
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
