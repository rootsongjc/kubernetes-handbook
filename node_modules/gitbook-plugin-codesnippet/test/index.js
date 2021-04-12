var path = require('path');
var tester = require('gitbook-tester');
var assert = require('assert');

var pkg = require('../package.json');

describe('codesnippet', function() {
    it('should include file', function() {
        return tester.builder()
            .withContent('#test me\n\n{% codesnippet "./myfile.js" %}{% endcodesnippet %}')
            .withLocalPlugin(path.join(__dirname, '..'))
            .withBookJson({
                gitbook: pkg.engines.gitbook,
                "plugins": ["codesnippet"]
            })
            .withFile('myfile.js', 'test')
            .create()
            .then(function(result) {
                var index = result.get('index.html');
                var $ = index.$;

                var codeBlock = $('code[class="lang-js"]');

                assert.equal(codeBlock.length, 1);
                assert.equal(codeBlock.text(), 'test');
            });
    });

    it('should include an url', function() {
        return tester.builder()
            .withContent('#test me\n\n{% codesnippet "https://gist.githubusercontent.com/magnetikonline/5274656/raw/6c7281322dc82145f4648891e66fdda02503c881/README.md" %}{% endcodesnippet %}')
            .withLocalPlugin(path.join(__dirname, '..'))
            .withBookJson({
                gitbook: pkg.engines.gitbook,
                "plugins": ["codesnippet"]
            })
            .withFile('myfile.js', 'test')
            .create()
            .then(function(result) {
                var index = result.get('index.html');
                var $ = index.$;

                var codeBlock = $('code[class="lang-md"]');

                assert.equal(codeBlock.length, 1);
                assert(codeBlock.text().length > 0);
            });
    });

    it('should accept a specific language', function() {
        return tester.builder()
            .withContent('#test me\n\n{% codesnippet "./myfile.js", language="hello" %}{% endcodesnippet %}')
            .withLocalPlugin(path.join(__dirname, '..'))
            .withBookJson({
                gitbook: pkg.engines.gitbook,
                "plugins": ["codesnippet"]
            })
            .withFile('myfile.js', 'test')
            .create()
            .then(function(result) {
                var index = result.get('index.html');
                var $ = index.$;

                var codeBlock = $('code[class="lang-hello"]');

                assert.equal(codeBlock.length, 1);
                assert.equal(codeBlock.text(), 'test');
            });
    });

    it('should accept inner content', function() {
        return tester.builder()
            .withContent('#test me\n\n{% codesnippet %}this is a {{ book.var|d("variable") }}{% endcodesnippet %}')
            .withLocalPlugin(path.join(__dirname, '..'))
            .withBookJson({
                gitbook: pkg.engines.gitbook,
                "plugins": ["codesnippet"]
            })
            .withFile('myfile.js', 'test')
            .create()
            .then(function(result) {
                var index = result.get('index.html');
                var $ = index.$;

                var codeBlock = $('code');

                assert.equal(codeBlock.length, 1);
                assert.equal(codeBlock.text(), 'this is a variable');
            });
    });

    it('should slice lines', function() {
        return tester.builder()
            .withContent('#test me\n\n{% codesnippet "./myfile.js", lines="2:4" %}{% endcodesnippet %}')
            .withLocalPlugin(path.join(__dirname, '..'))
            .withBookJson({
                gitbook: pkg.engines.gitbook,
                "plugins": ["codesnippet"]
            })
            .withFile('myfile.js', 'test\ntest 2\ntest 3\ntest 4')
            .create()
            .then(function(result) {
                var index = result.get('index.html');
                var $ = index.$;

                var codeBlock = $('code[class="lang-js"]');

                assert.equal(codeBlock.length, 1);
                assert.equal(codeBlock.text(), 'test 2\ntest 3');
            });
    });
});