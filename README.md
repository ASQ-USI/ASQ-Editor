## ABOUT

GUI Editor for [impress.js](https://github.com/bartaz/impress.js/).

There is now an online version (may include work in progress). 

[Editor demo](http://giokokos.github.io/editor/demo.html?edit)


> Add the `?edit` query after the .html extension to redirect you at the editing mode.

There is an [About](https://github.com/giokokos/editor/wiki/About) page too.

**NOTE:** Everything is done on the client side therefore there isn't any download utility for the moment. 

## BOOKMARKLET
Add the bookmarklet to you browser:
  <a href='javascript:!function(){if("undefined"==typeof window.builder){var a=document.createElement("link");a.setAttribute("rel","stylesheet"),a.setAttribute("type","text/css"),a.setAttribute("href","http://asq.inf.usi.ch/editor/dist/ASQ-Editor.min.css"),document.getElementsByTagName("head")[0].appendChild(a);var b=document.createElement("SCRIPT");b.type="text/javascript",b.src="http://asq.inf.usi.ch/editor/dist/ASQ-Editor.min.js","undefined"!=typeof b&&document.getElementsByTagName("head")[0].appendChild(b)}b.onloadDone=!1,b.onload=function(){b.onloadDone=!0,builder.bootstrap()},aEScript.onReadystatechange=function(){"loaded"!==aEScript.readyState||aEScript.onloadDone||(aEScript.onloadDone=!0,builder.bootstrap())}}();)'><strong>Bookmark me!</strong></a>
   to instantly edit your impress.js presentations _(requires the modified impress.js)_

## FEATURES

* Create slides
* Delete slides
* Working with text ([nicEdit](http://nicedit.com/) is integrated)
	* h1/h2/...
	* Choosing font size
	* Left/Center/Right Alignment
	* Bold/Italic/Links
	* fonts
	* uploading image
	* changing colors
	* changing the HTML code
* Choose different themes
	* Custom CSS background gradients
* Change position of steps (Sliders and inputs)
	* Move 
	* Rotate (also in 3d)
	* Scale
* Menu of slides
* Multiple selection of slides
* Canvas for highlighting context on presentation mode
* Layouts including custom algorithms

**NOTE:** Impress.js is extended to support all these features.

## CREDITS

You can find the impress.js framework [here](https://github.com/bartaz/impress.js/).

The current project is inspired and partially based on [builder4impress](https://github.com/naugtur/builder4impress).

## LICENSE

Copyright 2013 George Kokosioulis

Released under the MIT License