/*\
title: $:/custom/filter/searchlist.js
type: application/javascript
tags: customized
module-type: filteroperator

Filter input tiddlers by a list of strings instead of a single string.

options: 1.full; 2.partial

\*/
"use strict";

/*
Export our filter function
*/
exports.searchlist = function(source,operator,options) {
	var results = [], opt = operator.suffix || "full", arr = $tw.utils.parseStringArray(operator.operand);
	if(opt === "full") {
		source(function(tiddler,title) {
			var res = arr.every (elem => {
				return title !== elem;
			});
			if(!res) results.push(title);
		});
	} else if(opt === "partial") {
		source(function(tiddler,title) {
			var res = arr.every (elem => {
				return title.indexOf(elem) === -1;
			});
			if (!res) results.push(title);
		});
	}
	return results;
};
