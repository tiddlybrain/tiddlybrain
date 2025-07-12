/*\
title: $:/custom/filter/colorize.js
type: application/javascript
tags: customized
module-type: filteroperator

Turn tiddler titles into Hex colors

\*/
"use strict";

/*
Helper functions
*/
//https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
var stringToColor = function(str,opacity) {
	var hash = 0;
	for (var i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	var color = '#';
	for (var i = 0; i < 3; i++) {
		const value = (hash >> (i * 8)) & 0xFF; // Get the byte value
		const hex = value.toString(16).padStart(2, '0'); // Convert to hex and ensure 2 digits
		color += hex; // Append to the color string
	}
	return color + opacity;
}

/*
Export our filter function
*/
exports.colorize = function(source,operator,options) {
	var results = [], opacity = operator.operand || "ff";
	source(function(tiddler,title) {
		var colorCode = stringToColor(title,opacity);
		results.push(colorCode);
	});
	return results;
};
