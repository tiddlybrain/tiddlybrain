/*\
title: $:/custom/filter/getAllTiddlers.js
type: application/javascript
tags: customized
module-type: filteroperator

1. Find all tiddlers inside of normal tiddlers, e.g. [[tiddlers]getAllTiddlers:note[abc]]
2. Return tiddlers that have specific tiddler in its content, e.g. [[tiddlers]hasTiddler[abc]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.getAllTiddlers = function(source,operator,options) {
	var results = [], matches, pattern = /<<l\s+'(.+?)'.*>>|<<l\s+"(.+?)".*>>|\[\[.+\|(.+)\]\]|\[\[(.+)\]\]/g;
	var suffixes = operator.suffixes || [], field = (suffixes[0] || [])[0], value = operator.operand || null;
	source(function(tiddler,title) {
		if(tiddler) {
			let content = tiddler.getFieldString("caption") + tiddler.getFieldString("description") + tiddler.getFieldString("text");
			while(matches = pattern.exec(content)) {
				matches.shift();
				matches.forEach(match => {
					if(match !== undefined && options.wiki.tiddlerExists(match)) {
						if(field) {
							if(options.wiki.getTiddler(match).getFieldString(field) === value) {
								results.push(match);
							}
						} else {
							results.push(match);
						}
					}
				});
			}
		}
	});
	return results;
};

exports.hasTiddler = function(source,operator,options) {
	var results = [], matches, pattern = /<<l\s+'(.+?)'.*>>|<<l\s+"(.+?)".*>>|\[\[.+\|(.+)\]\]|\[\[(.+)\]\]/g, value = operator.operand;
	source(function(tiddler,title) {
		if(tiddler) {
			if(options.wiki.tiddlerExists(value)) {
				let content = tiddler.getFieldString("caption") + tiddler.getFieldString("description") + tiddler.getFieldString("text");
				while(matches = pattern.exec(content)) {
					let result = undefined;
					matches.shift();
					matches.every(match => {
						if(match === value) {
							result = value;
							return false;
						} else {
							return true;
						}
					});
					if(result === value) {
						results.push(title);
						break;
					}
				}
			} else {
				results.push(title);
			}
		}
	});
	return results;
};

})();
