/*\
title: $:/custom/filter/getTitles.js
type: application/javascript
tags: customized
module-type: filteroperator

1. Find all tiddler titles inside of a data tiddler content, e.g. [[tiddlers]getAllIndexTitles[]]
2. Find all tiddler titles inside of a normal tiddler content, e.g. [[tiddlers]getAllTitles[]]
3. Find all tiddler titles of tags, e.g. [[tiddlers]getAllTagTitles[]]
4. Find all backlink titles of the current tiddler, e.g. [[tiddlers]getBacklinkTitles[]]

\*/
"use strict";

/*
Export our filter function
*/
exports.getAllIndexTitles = function(source,operator,options) {
	var results = [], result, data, re = /\s*(?:;;)\s*/;
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
	var results = [], matches, pattern = /<<l\s+["'](.+?)["'].*?>>|\[\[.+?\|(.+?)\]\]|\[\[(.+?)\]\]/g;
	source(function(tiddler,title) {
		if (tiddler) {
			let content = tiddler.getFieldString("text");
			while (matches = pattern.exec(content)) {
				matches.shift();
				matches.forEach(match => {
					if (match !== undefined && options.wiki.tiddlerExists(match)) {
						let caption = options.wiki.getTiddler(match).getFieldString("caption") || match;
						let result = options.wiki.renderText("text/plain","text/vnd.tiddlywiki",caption,{
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

exports.getAllTagTitles = function(source,operator,options) {
	var results = [], result, match, pattern = /^[a-zA-Z]+\s\d+$/;
	source(function(tiddler,title) {
		if (tiddler) {
			tiddler.fields.tags.forEach(tag => {
				match = tag.match(pattern);
				if (match !== null && options.wiki.tiddlerExists(match)) {
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
	});
	return results;
};

exports.getBacklinkTitles = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var pattern = "(\\[\\[|\\||;;|\"|\'|:|\\s|#|^)" + title + "(\\]\\]|;;|\"|\'|:|\\s|\\n|$)", re = new RegExp(pattern);
		options.wiki.each(function(newTiddler,newTitle) {
			let content = newTiddler.getFieldString("text");
			if(re.test(content)) {
				let caption = options.wiki.getTiddler(newTitle).getFieldString("caption") || newTitle;
				let result = options.wiki.renderText("text/plain","text/vnd.tiddlywiki",caption,{
					parseAsInline: true,
					variables: {
						currentTiddler: newTitle
					},
					parentWidget: options.widget
				});
				results.push(result);
			}
		});
	});
	return results;
};
