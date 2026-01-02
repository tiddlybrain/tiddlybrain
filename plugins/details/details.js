/*\
title: $:/plugins/yuz/details/details.js
type: application/javascript
module-type: widget

Will output an HTML 5 <details> section including a <summary>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DetailsWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DetailsWidget.prototype = new Widget();

exports.details = DetailsWidget;

})();
