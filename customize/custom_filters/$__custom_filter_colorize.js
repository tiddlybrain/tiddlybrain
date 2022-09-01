/*\
title: $:/custom/filter/colorize.js
type: application/javascript
tags: customized
module-type: filteroperator

Turn tiddler titles into Hex colors

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Helper functions
*/
//https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
var stringToColor = function(str) {
	var hash = 0;
	for (var i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	var color = '#';
	for (var i = 0; i < 3; i++) {
		var value = (hash >> (i * 8)) & 0xFF;
		color += ('00' + value.toString(16)).substr(-2);
	}
	return color;
}

/*
Export our filter function
*/
exports.colorize = function(source,operator,options) {
        var results = [];
	source(function(tiddler,title) {
		var colorCode = stringToColor(title);
		results.push(colorCode);
	});
	return results;
};

})();
