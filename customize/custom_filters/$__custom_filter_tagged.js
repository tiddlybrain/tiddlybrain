/*\
title: $:/custom/filter/tagged.js
type: application/javascript
tags: customized
module-type: filteroperator

Filter input tiddlers in which all tags specified in the operand are tagged.

\*/
"use strict";

/*
Export our filter function
*/
exports.tagged = function(source,operator,options) {
	var results = [], invert = operator.prefix === "!";
	var tagsArray = $tw.utils.parseStringArray(operator.operand);
	source(function(tiddler,title) {
		if(tiddler && tiddler.fields.tags) {
			let result = tagsArray.every(function(tag) {
				return tiddler.fields.tags.indexOf(tag) !== -1;
			});
			if(invert) {
				if(result === false) results.push(title);
			} else {
				if(result === true) results.push(title);
			}
		}
	});
	return results;
};
