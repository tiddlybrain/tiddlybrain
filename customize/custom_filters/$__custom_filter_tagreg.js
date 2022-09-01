/*\
title: $:/custom/filter/tagreg.js
type: application/javascript
tags: customized
module-type: filteroperator

Check if a tiddler has tags that match the regex pattern

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.tagreg = function(source,operator,options) {
	var results = [], regexpString = operator.operand, regexp, flags, invert = operator.prefix === "!";
	if(regexpString) {
		// Process flags and construct regexp
		var match = /^\(\?([gim]+)\)/.exec(regexpString);
		if(match) {
			flags = match[1];
			regexpString = regexpString.substr(match[0].length);
		} else {
			match = /\(\?([gim]+)\)$/.exec(regexpString);
			if(match) {
				flags = match[1];
				regexpString = regexpString.substr(0,regexpString.length - match[0].length);
			}
		}
		try {
			regexp = new RegExp(regexpString,flags);
		} catch(e) {
			return ["" + e];
		}
		// Process the incoming tiddlers
		source(function(tiddler,title) {
			if(tiddler && tiddler.fields.tags) {
				var match = false;
				tiddler.fields.tags.every(function(tag) {
					if(regexp.test(tag)) {
						if(invert) {
							match = false;
							return false;
						} else {
							match = true;
							return false;
						}
					} else {
						if(invert) {
							match = true;
							return true;
						} else {
							return true;
						}
					}
				});
				if(match) results.push(title);
			}
		});
	} else {
		if(!invert) {
			source(function(tiddler,title) {
				results.push(title);
			});
		}
	}
	return results;
};

})();
