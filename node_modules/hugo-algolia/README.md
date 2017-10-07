# hugo-algolia
**Generate and send indices from Hugo static sites for use with Algolia.**

An alternative to the [Docsearch](https://community.algolia.com/docsearch/) plugin, allowing for manual index exports. Supports YAML, JSON, and TOML front matter.

### Installation

Install `hugo-algolia` from [npm](https://npmjs.org)

```
npm install hugo-algolia
```

Or

```
yarn add hugo-algolia
```

### How does it work?
`hugo-algolia` looks into the `/content` folder of your site by default and places a JSON file with the export into the `/public` folder, but if you'd like to use custom inputs and outputs just pass an `-i` or `-o` followed by your path via command line.

#### Example
In your package.json file:

```
//Default
scripts: {
    "index": "hugo-algolia"
}
```

or

```
scripts: {
    "index": "hugo-algolia -i \"content/subdir/**\" -o public/my-index.json"
}
```

### Sending to Algolia
You can send your index to Algolia by including your API key, app ID, and index name in your config.yaml, which you can find in your Algolia account dashboard. Then, pass an `-s` flag to your `hugo-algolia` command.

```
---
baseURL: "/"
languageCode: "en-us"
title: "Your site name"
theme: "your-theme"
description: "A cool site!"

algolia:
  index: "index-name"
  key: "[your API key]"
  appID: "[your app id]"
---
```

then 

```
scripts: {
    "index-and-send": "hugo-algolia -s"
}
```

**If you don't want to set your write key in your `config.yaml`, you can also use environment variables. Just set a variable `ALGOLIA_WRITE_KEY` to the write key for your account, and the module will use that instead.**

### What if I don't want to index a specific file?
That's cool! Just set the `index` param in your file's front matter to `false` and `hugo-algolia` will skip it during the indexing process.

### Options
There are a few flags you can use to customize your indices:

* `-m` - Create multiple indices based on the default `index` param in the front matter of each markdown file, or another specified param. 
	```
    hugo-algolia -m "[optional-custom-param]"
	```
* `-p` - Partially index files using only specified params.
	```
    hugo-algolia -p "[param], [param], [param]"
	```
* `-all` - By default, `hugo-algolia` skips content that doesn't have an `index` param, or whichever param you specify in your command. If you'd like to index those files, use this flag.

##### You can also combine any of the above commands, including the one's mentioned outside of this section:
```
hugo-algolia -m "categories" -p "title, uri, categories" -all 
```

This command would create multiple indices depending on the category of each `.md` file, but only inlcude the `title`, `uri`, and `categories` information in the output file.

#### A note about TOML
The `gray-matter` package used in this module does not support TOML front matter out of the box. If you're using TOML in your front matter, just use the `toml` flag in your command.

```
hugo-algolia -toml
```

# License
This project is based on the lunr plugin from https://github.com/dgrigg/hugo-lunr, but adapted for use with the Algolia search engine. It is under the ISC License. 