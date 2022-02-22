var Q = require('q');
var url = require('url');
var fs = require('fs');
var path = require('path');
var request = require('request');

function codeblock(language, content) {
    return '<pre><code class="lang-' + language + '">' + content + '</code></pre>';
}

// Convert a range to a {start,end} object
function rangeToLines(range) {
    range = (range || '').split(':');
    if (range.length != 2) {
        return null;
    }

    return {
        start: Number(range[0]) - 1,
        end: Number(range[1]) - 1
    }
}

module.exports = {
    blocks: {
        codesnippet: {
            process: function(block) {
                var that = this;
                var filename = block.args[0];

                // Lines range
                var range = rangeToLines(block.kwargs.lines);

                // Determine language
                var language = block.kwargs.language || (filename? path.extname(filename).slice(1) : '');

                if (!filename) return codeblock(language, block.body);

                // Read the file
                return Q()

                .then(function() {
                    if (url.parse(filename).protocol) {
                        var d = Q.defer();

                        request(filename, function (error, response, body) {
                            if (error) return d.reject(error);
                            if (Math.floor(response.statusCode/200) != 1) d.reject(new Error('No 2XX status code when downloading '+filename));

                            d.resolve(body.toString('utf-8'));
                        });

                        return d.promise;
                    } else {
                        return that.book.readFile(filename);
                    }
                })

                // Return the html content
                .then(function(content) {
                    if (range) {
                        var lines = content.match(/[^\r\n]+/g);
                        lines = lines.slice(range.start, range.end);
                        content = lines.join('\n');
                    }

                    return codeblock(language, content);
                });
            }
        }
    }
};
