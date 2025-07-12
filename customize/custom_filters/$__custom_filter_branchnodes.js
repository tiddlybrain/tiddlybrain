/*\
title: $:/custom/filter/branchnodes.js
type: application/javascript
tags: customized
module-type: filteroperator

Get all brance nodes from tiddler titles

\*/
"use strict";

/*
Export our filter function
*/
exports.branchnodes = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var values = title.split("/");
		values.pop();
		values.shift();
		values.forEach(function(value) {
			if(results.indexOf(value) === -1) {
				results.push(value);
			}
		});
	});
	return results;
};
