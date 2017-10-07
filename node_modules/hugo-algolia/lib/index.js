var fs = require('fs');
var path = require('path');
var matter = require('gray-matter');
var glob = require('glob');
var removeMarkDown = require('remove-markdown');
var stripTags = require('striptags');
var algoliasearch = require('algoliasearch');
var snake = require('to-snake-case');
var _ = require('lodash');
var toml = require('toml');
var { copySettings, copySynonyms, convertToMap } = require('./utils');
var write_key = process.env.ALGOLIA_WRITE_KEY;

function HugoAlgolia(input, output, index) {
    const self = this;
    this.list = [];
    this.indices = {};

    // Default creds
    this.algoliaCredentials = {
        indexName: "",
        key: "",
        appID: ""
    };

    // Options
    this.input = 'content/**';
    this.pathToCredentials = './config.yaml';
    this.output = 'public/algolia.json';
    this.localIndexName = "index";
    this.sendData = false;
    this.multInd = false;
    this.writeOtherData = false;
    this.language = undefined;
    this.delims = undefined;

    this.partial = false; 
    this.customInd = [];

    this.categoryToIndex = "index"; 

    // Set custom input
    if(process.argv.indexOf("-i") !== -1) {
        this.input = (process.argv[process.argv.indexOf("-i") + 1])
    }

    if(process.argv.indexOf("-toml") !== -1) {
        this.language = 'toml';
        this.delims = '+++';
    }

    // Set custom output
    if(process.argv.indexOf("-o") !== -1) {
        this.output = process.argv[process.argv.indexOf("-o") + 1];
    }

    // Turn off "other" category
    if(process.argv.indexOf("-all") !== -1) {
        this.writeOtherData = true;
    }

    // Send to Algolia
    if(process.argv.indexOf("-s") !== -1) {
        this.sendData = true;
    }

    // Set multiple indices to true
    if(process.argv.indexOf("-m") !== -1) {
        let categoryToIndex = process.argv[process.argv.indexOf("-m") + 1];

        if(categoryToIndex !== undefined && !categoryToIndex.includes('-')) {
            this.categoryToIndex = categoryToIndex;
        }

        this.multInd = true;
    }

    if(process.argv.indexOf("-p") !== -1) {
        let customInd = process.argv[process.argv.indexOf("-p") + 1];
        const error = "No categories specified."

        // We have some args
        if(customInd !== undefined)  {
            // Split into array, remove duplicates and falsey values
            customInd = customInd.split(',').map(ind => ind.trim());
            customInd = _.uniq(customInd);
            customInd = _.compact(customInd);

            // Empty quotes
            if(customInd.length === 0 ) throw error;

        // No args
        }  else {
            throw error;
        }

        this.partial = true;
        this.customInd = customInd;
    }

    HugoAlgolia.prototype.setCredentials = function () {
        const configMeta = matter.read(self.pathToCredentials);
        const creds = configMeta.data.algolia;

        if(creds) {
            self.algoliaCredentials = {
                indexName: creds.index,
                key: (write_key && write_key !== undefined) ? write_key : creds.key,
                appID: creds.appID
            }
            self.localIndexName = creds.index;
        }
        
    }

    HugoAlgolia.prototype.index = function() {
        self.setCredentials();
        self.stream = fs.createWriteStream(self.output);
        self.readDirectory(self.input);

        // Create file with multiple indices
        if(self.multInd) {
            self.handleMultInd(self.list);
            self.stream.write(JSON.stringify(self.indices, null, 4) );
        } else {
            self.stream.write(JSON.stringify(self.list, null, 4) );
        }

        self.stream.end();
        console.log(`JSON index file was created in ${self.output}`);

        // Send data to algolia only if -s flag = true
        if(self.sendData && self.multInd) {
            for (index in self.indices) {
                //             Obj,                 Name
                self.sendIndex(self.indices[index], index);
            }
        } else if (self.sendData) {
            self.sendIndex();
        }
    }

    HugoAlgolia.prototype.pushToIndices = function(name, obj) {
        let indices = self.indices;
        let isIndexInIndices = indices.hasOwnProperty(name);

        if(!isIndexInIndices) {
            // Check for accidental empty index
            const noSpace = name.replace(/\s/g, "");
            if(noSpace !== "") {
                // Create index in indices and push item into it
                indices[name] = [];
                indices[name].push(obj);
            } else {
                // Push to "other" index
                indices[other].push(obj);
            }
        // Does this index already exist?
        } else {
            indices[name].push(obj);         
        }

        indices = self.indices; 
    }

    HugoAlgolia.prototype.handleMultInd = function(list) {
        // Set a place for "other" data to go if no index specified
        var other = snake(self.localIndexName + " other");
        var listToIndex = list;

        if(self.writeOtherData) self.indices[other] = [];     

        for (item of listToIndex) {
            const obj = item;

            const hasIndex = obj.hasOwnProperty(self.categoryToIndex);
            const indexProp = obj[self.categoryToIndex];

            // Does this item have the index category?         
            if(hasIndex) {
                // Is the prop an array of categories?
                if(_.isArray(indexProp)) {
                    for (item of indexProp) {
                        let indexName = snake(self.localIndexName + " " + item);
                        self.pushToIndices(indexName, obj);
                    }
                } else {
                    let indexName = snake(self.localIndexName + " " + indexProp);
                    self.pushToIndices(indexName, obj);
                }
            } else if(self.writeOtherData) {
                self.pushToIndices(other, obj);
            }
        }
        
    }
    
    HugoAlgolia.prototype.sendIndex = function(indObj, name) {
        // Send data to Algolia
        const { key, appID } = self.algoliaCredentials;
        const indexName = name ? name : self.algoliaCredentials.indexName;
        const client = algoliasearch(appID, key);
        const index = client.initIndex(indexName);
        const tmpIndex = client.initIndex(`${indexName}-temp`);
        const indexToSend = indObj ? indObj : self.list;

        // Copy index settings/synonyms to new index
        copySettings(index, tmpIndex);
        copySynonyms(index, tmpIndex);

        tmpIndex.addObjects(indexToSend, (err, content) => {
            if(err) {
                console.log(err);
                return;
            }

            client.moveIndex(tmpIndex.indexName, index.indexName, (err, content) => {
                if(err) {
                    console.log(err);
                } else {
                    console.log(content);
                }
            });
        });
    }
    
    HugoAlgolia.prototype.readDirectory = function(path) {
        const files = glob.sync(path);

        for(let i = 0; i < files.length; i++) {
            let stats = fs.lstatSync(files[i]);

            // Remove folders, only gather actual files
            if(!stats.isDirectory()) {
                // If this is not a directory/folder, read the file
                self.readFile(files[i]);
            }
        }
    }

    HugoAlgolia.prototype.formatDataInFile = function(meta, filePath) {
        // Define algolia object
        var item = {};
        var uri = '/' + filePath.substring(filePath.lastIndexOf('./'));

        if(meta.data) {
            for (prop in meta.data) {
                item[prop] = meta.data[prop];

                //Prevent duplicate uri props
                item.uri = meta.data.uri ? meta.data.uri :
                    uri.split('/').splice(2).join("/")
                       .replace(/\.[^/.]+$/, "");

                //Remove _index + index files from uri
                const compUriArray = item.uri.split('/');
                const lastItemInCompArray = compUriArray[compUriArray.length - 1];
                if(lastItemInCompArray.includes("index") || lastItemInCompArray.includes("_index")) {
                    compUriArray.pop();
                    item.uri = compUriArray.join('/');
                }
                
                item.content = meta.content;

                // If this is a partial index, remove everything but the props we want
                if(self.partial) {
                    item = _.pick(item, self.customInd);
                }

            }
        }

        return item;
    }

    HugoAlgolia.prototype.readFile = function(filePath) {
        const ext = path.extname(filePath);
        const meta = matter.read(filePath, {
            language: self.language,
            delims: self.delims,
            engines: {
                toml: toml.parse.bind(toml)
            }
        });

        // If item.index is false, we don't want to index this
        if (meta.data.index === false) return;

        meta.content = removeMarkDown(meta.content);
		meta.content = stripTags(meta.content);

        var item = self.formatDataInFile(meta, filePath);

        if(!_.isEmpty(item)) self.list.push(item);
    }

}

module.exports = HugoAlgolia;