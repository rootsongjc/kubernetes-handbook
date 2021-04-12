# Prism themes

This repository lists a selection of additional themes for the [Prism syntax highlighting library](http://prismjs.com/).

## How to use a theme

To use one of the themes, just include the theme's CSS file in your page. Example:

```html
<!DOCTYPE html>
<html>
    <head>
        ...
        <link href="themes/prism-ghcolors.css" rel="stylesheet" />
    </head>
    <body>
        ...
        <script src="prism.js"></script>
    </body>
</html>
```

## Adding a New Theme

To add your own theme, copy it into the `themes` directory and add your themes to the list of available themes in the readme.
The links for your themes have to be `themes/prism-<your theme>.css` for the theme itself and `screenshots/prism-<your theme>.png` for the screenshot.

The screenshot will be created for you by running the following command:

```bash
npm i && npx gulp screenshot
```

Before making a pull request, you can the following command to verify that all checks pass:

```bash
npm test
```

Thank you so much for contributing!!

## Available themes

* [__CB__](themes/prism-cb.css) (originally by [C. Bavota](https://bitbucket.org/cbavota), adapted by [atelierbram](https://github.com/atelierbram))<br />
[![CB](screenshots/prism-cb.png)](themes/prism-cb.css)

* [__GHColors__](themes/prism-ghcolors.css) (by [aviaryan](https://github.com/aviaryan))<br />
[![GHColors](screenshots/prism-ghcolors.png)](themes/prism-ghcolors.css)

* [__Pojoaque__](themes/prism-pojoaque.css) (originally by [Jason Tate](http://web-cms-designs.com/ftopict-10-pojoaque-style-for-highlight-js-code-highlighter.html), adapted by [atelierbram](https://github.com/atelierbram))<br />
[![Pojoaque](screenshots/prism-pojoaque.png)](themes/prism-pojoaque.css)

* [__Xonokai__](themes/prism-xonokai.css) (originally by [Maxime Thirouin (MoOx)](https://github.com/MoOx), adapted by [atelierbram](https://github.com/atelierbram))<br />
[![Xonokai](screenshots/prism-xonokai.png)](themes/prism-xonokai.css)

* [__Ateliersulphurpool-light__](themes/prism-base16-ateliersulphurpool.light.css) (by [Bram de Haan](https://github.com/atelierbram))<br />
[![Ateliersulpherpool-light](screenshots/prism-base16-ateliersulphurpool.light.png)](themes/prism-base16-ateliersulphurpool.light.css)

* [__Hopscotch__](themes/prism-hopscotch.css) (by [Jan T. Sott](https://github.com/idleberg))<br />
[![Hopscotch](screenshots/prism-hopscotch.png)](themes/prism-hopscotch.css)

* [__Atom Dark__](themes/prism-atom-dark.css) (by [gibsjose](https://github.com/gibsjose), based on [Atom Dark Syntax theme](https://github.com/atom/atom-dark-syntax))<br />
[![Atom Dark](screenshots/prism-atom-dark.png)](themes/prism-atom-dark.css)

* [__Duotone Dark__](themes/prism-duotone-dark.css) (by [Simurai](https://github.com/simurai), based on [Duotone Dark Syntax theme for Atom](https://github.com/simurai/duotone-dark-syntax))<br />
[![Duotone Dark](screenshots/prism-duotone-dark.png)](themes/prism-duotone-dark.css)

* [__Duotone Sea__](themes/prism-duotone-sea.css) (by [Simurai](https://github.com/simurai), based on [DuoTone Dark Sea Syntax theme for Atom](https://github.com/simurai/duotone-dark-sea-syntax))<br />
[![Duotone Sea](screenshots/prism-duotone-sea.png)](themes/prism-duotone-sea.css)

* [__Duotone Space__](themes/prism-duotone-space.css) (by [Simurai](https://github.com/simurai), based on [DuoTone Dark Space Syntax theme for Atom](https://github.com/simurai/duotone-dark-space-syntax))<br />
[![Duotone Space](screenshots/prism-duotone-space.png)](themes/prism-duotone-space.css)

* [__Duotone Earth__](themes/prism-duotone-earth.css) (by [Simurai](https://github.com/simurai), based on [DuoTone Dark Earth Syntax theme for Atom](https://github.com/simurai/duotone-dark-earth-syntax))<br />
[![Duotone Earth](screenshots/prism-duotone-earth.png)](themes/prism-duotone-earth.css)

* [__Duotone Forest__](themes/prism-duotone-forest.css) (by [Simurai](https://github.com/simurai), based on [DuoTone Dark Forest Syntax theme for Atom](https://github.com/simurai/duotone-dark-forest-syntax))<br />
[![Duotone Forest](screenshots/prism-duotone-forest.png)](themes/prism-duotone-forest.css)

* [__Duotone Light__](themes/prism-duotone-light.css) (by [Simurai](https://github.com/simurai), based on [DuoTone Light Syntax theme](https://github.com/simurai/duotone-light-syntax))<br />
[![Duotone Light](screenshots/prism-duotone-light.png)](themes/prism-duotone-light.css)

* [__VS__](themes/prism-vs.css) (by [andrewlock](https://github.com/andrewlock))<br />
[![VS](screenshots/prism-vs.png)](themes/prism-vs.css)

* [__VS Code Dark+__](themes/prism-vsc-dark-plus.css) (by [tabuckner](https://github.com/tabuckner))<br />
[![VS](screenshots/prism-vsc-dark-plus.png)](themes/prism-vsc-dark-plus.css)

* [__Darcula__](themes/prism-darcula.css) (by [service-paradis](https://github.com/service-paradis), based on Jetbrains Darcula theme)<br />
[![Darcula](screenshots/prism-darcula.png)](themes/prism-darcula.css)

* [__a11y Dark__](themes/prism-a11y-dark.css) (by [ericwbailey](https://github.com/ericwbailey))<br />
[![a11y Dark](screenshots/prism-a11y-dark.png)](themes/prism-a11y-dark.css)

* [__Dracula__](themes/prism-dracula.css) (by [Byverdu](https://github.com/byverdu))<br />
[![a11y Dark](screenshots/prism-dracula.png)](themes/prism-dracula.css)

* [__Synthwave '84__](themes/prism-synthwave84.css) (originally by [Robb Owen](https://github.com/robb0wen), adapted by [Marc Backes](https://github.com/themarcba))<br />
[![Synthwave '84](screenshots/prism-synthwave84.png)](themes/prism-synthwave84.css)

* [__Shades of Purple__](themes/prism-shades-of-purple.css) (by [Ahmad Awais](https://github.com/ahmadawais))<br />
[![Shades of Purple](screenshots/prism-shades-of-purple.png)](themes/prism-shades-of-purple.css)

* [__Material Dark__](themes/prism-material-dark.css) (by [dutchenkoOleg](https://github.com/dutchenkoOleg))<br />
[![Material Dark](screenshots/prism-material-dark.png)](themes/prism-material-dark.css)

* [__Material Light__](themes/prism-material-light.css) (by [dutchenkoOleg](https://github.com/dutchenkoOleg))<br />
[![Material Light](screenshots/prism-material-light.png)](themes/prism-material-light.css)

* [__Material Oceanic__](themes/prism-material-oceanic.css) (by [dutchenkoOleg](https://github.com/dutchenkoOleg))<br />
[![Material Oceanic](screenshots/prism-material-oceanic.png)](themes/prism-material-oceanic.css)

* [__Nord__](themes/prism-nord.css) (originally by [Nord](https://www.nordtheme.com/), adapted by [Zane Hitchcox](https://github.com/zwhitchcox) and [Gabriel Ramos](https://github.com/gabrieluizramos))<br />
[![Nord](screenshots/prism-nord.png)](themes/prism-nord.css)
