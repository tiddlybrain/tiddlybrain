/*\
title: $:/custom/filter/titles.js
type: application/javascript
tags: customized
module-type: filteroperator

1. Find all tiddler titles inside of a data tiddler content, e.g. [[tiddlers]getAllIndexTitles[]]
2. Find all tiddler titles inside of a normal tiddler content, e.g. [[tiddlers]getAllTitles[]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.getAllIndexTitles = function(source,operator,options) {
	var results = [], result, data, re = /\s*(?:;;|$)\s*/;
	source(function(tiddler,title) {
		if (tiddler) {
			data = options.wiki.getTiddlerDataCached(title) || [];
			Object.keys(data).forEach(index => {
				data[index].split(re).forEach(datum => {
					if (datum !== "" && options.wiki.tiddlerExists(datum)) {
						let content = options.wiki.getTiddler(datum).getFieldString("caption") || datum;
						result = options.wiki.renderText("text/plain","text/vnd.tiddlywiki",content,{
							parseAsInline: true,
							variables: {
								currentTiddler: datum
							},
							parentWidget: options.widget
						});
						results.push(result);
					}
				});
			});
		}
	});
	return results;
};

exports.getAllTitles = function(source,operator,options) {
	var results = [], result, matches, pattern = /<<l\s+'(.+)'.*>>|<<l\s+"(.+)".*>>|\[\[.+\|(.+)\]\]|\[\[(.+)\]\]/g;
	source(function(tiddler,title) {
		if (tiddler) {
			let content = tiddler.getFieldString("caption") + tiddler.getFieldString("description") + tiddler.getFieldString("text");
			while (matches = pattern.exec(content)) {
				matches.shift();
				matches.forEach(match => {
					if (match !== undefined && options.wiki.tiddlerExists(match)) {
						let caption = options.wiki.getTiddler(match).getFieldString("caption") || match;
						result = options.wiki.renderText("text/plain","text/vnd.tiddlywiki",caption,{
							parseAsInline: true,
							variables: {
								currentTiddler: match
							},
							parentWidget: options.widget
						});
						results.push(result);
					}
				});
			}
		}
	});
	return results;
};

})();
