/*\
title: $:/plugins/yuz/hlc/hlc.js
type: application/javascript
module-type: widget

Highlight chunks of code within the code blocks.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var HLC = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
HLC.prototype = new Widget();

exports.hlc = HLC;

})();
