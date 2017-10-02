# Beautiful Hugo - A port of Beautiful Jekyll Theme

![Beautiful Hugo Theme Screenshot](https://github.com/halogenica/beautifulhugo/blob/master/images/screenshot.png)

## Installation

    $ mkdir themes
    $ cd themes
    $ git clone https://github.com/halogenica/beautifulhugo.git beautifulhugo

See [the Hugo documentation](http://gohugo.io/themes/installing/) for more information.

## Extra Features

### Responsive

This theme is designed to look great on both large-screen and small-screen (mobile) devices.

### Syntax highlighting

This theme has support for both server side and client side highlighting.

#### Server side syntax highlighting

Use the `highlight` shortcode (with Pygments),
see [the Hugo documentation](http://gohugo.io/extras/highlighting/) for more information.

To use this feature install Pygments (`pip install Pygments`) and add `pygmentsuseclasses = true` to your `config.toml`.

#### Client side syntax highlighting

Use triple backticks ( ``` ) or triple tilde ( ~~~ ) around code blocks.

Client side highlighting does not require pygments to be installed.

### Disqus support

To use this feature, uncomment and fill out the `disqusShortname` parameter in `config.toml`.

### Google Analytics

To add Google Analytics, simply sign up to [Google Analytics](http://www.google.com/analytics/) to obtain your Google Tracking ID, and add this tracking ID to the `googleAnalytics` parameter in `config.toml`.

### Commit SHA on the footer

If the source of your site is in a Git repo, the SHA corresponding to the commit the site is built from can be shown on the footer. To do so, two environment variables have to be set (`GIT_COMMIT_SHA` and `GIT_COMMIT_SHA_SHORT`) and parameter `commit` has to be defined in the config file:

```
[Params]
  commit = "https://github.com/<username>/<siterepo>/tree/"
```
  
This can be achieved by running the next command prior to calling Hugo:

```
  GIT_COMMIT_SHA=`git rev-parse --verify HEAD` GIT_COMMIT_SHA_SHORT=`git rev-parse --short HEAD`
```
  
See at [xor-gate/xor-gate.org](https://github.com/xor-gate/xor-gate.org) an example of how to add it to a continuous integration system.
  
## About

This is a port of the Jekyll theme [Beautiful Jekyll](http://deanattali.com/beautiful-jekyll/) by [Dean Attali](http://deanattali.com/aboutme#contact). It supports most of the features of the original theme.

## License

MIT Licensed, see [LICENSE](https://github.com/halogenica/Hugo-BeautifulHugo/blob/master/LICENSE).
