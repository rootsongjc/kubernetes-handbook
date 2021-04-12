# gitbook-plugin-prism-themes
This repository is [gitbook plugin](http://toolchain.gitbook.com/plugins/)
for [prism-themes](https://github.com/PrismJS/prism-themes). 

It provides additional themes when using [gitbook-plugin-prism](https://github.com/gaearon/gitbook-plugin-prism)。

 
## Usage
 

1. Add the plugin to your `book.json`, and disable default GitBook code highlighting:

    ```json
    {
      "plugins": ["-highlight", "prism", "prism-themes"]
    }
    ``` 
    
1. Install the plugins

    ```bash
    gitbook install
    ```

1. Update `gitbook-plugin-prism`'s configuration,  override default styles:

    ```json
    "pluginsConfig": {  
      "prism": {
        "css": [
          "prism-themes/themes/prism-duotone-dark.css"
        ]
      }
    }
    ```
    All css files must reside in the same folder.
    The css file's root path is `${yourBookDir}/node_modules/`.
    The NPM module `prism-themes` is an dependency of this plugin.

## License

Apache 2



