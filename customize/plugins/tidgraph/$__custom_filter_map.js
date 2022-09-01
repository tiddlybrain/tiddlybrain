/*\
title: $:/custom/filter/map.js
type: application/javascript
tags: customized
module-type: filteroperator

To create a mindmap of snippets

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Helper functions
*/
var getSnippetsData = function(title,note,options) {
	var results = [];
	options.wiki.each(function(newTiddler,newTitle) {
		if ($tw.utils.hop(newTiddler.fields,'belongs.to') && newTiddler.fields['belongs.to'] === title) {
			var noteValue = newTiddler.fields['note'];
			if (noteValue === note) results.push(newTitle);
		}
	});
	return results;
}

var getSnippetsRecord = function(title,options) {
	var results = [];
	options.wiki.each(function(newTiddler,newTitle) {
		if ($tw.utils.hop(newTiddler.fields,'belongs.to') && newTiddler.fields['belongs.to'] === title) results.push(newTitle);
	});
	if (title.indexOf("/") !== -1) $tw.utils.pushTop(results,options.wiki.getTiddlersWithTag(title));
	return results;
}

var getKeys = function(tiddler,title,operator,options) {
	var results = [], hide = tiddler.getFieldList('hide') || [], data = options.wiki.getTiddlerDataCached(title);
	if (operator.operand) $tw.utils.pushTop(hide,$tw.utils.parseStringArray(operator.operand));
	if (data) {
		var keys = Object.keys(data);
		if ($tw.utils.hop(tiddler.fields,'celltpl')) {
			var tpl = options.wiki.getTiddler(tiddler.fields['celltpl']);
			if (tpl && tpl.fields['type'] === 'text/vnd.tiddlywiki') {
				keys.forEach(key => {
					if (hide.indexOf(key) === -1 && key.substring(0,2) !== '--') {
						var s = key + '##' + title;
						results.push(s);
					}
				});
			} else if (tpl && tpl.fields['type'] === 'application/x-tiddler-dictionary') {
				var tpldata = options.wiki.getTiddlerDataCached(tpl.fields.title);
				keys.forEach(key => {
					if (hide.indexOf(key) === -1 && key.substring(0,2) !== '--' && key in tpldata) {
						var s = key + '##' + title;
						results.push(s);
					}
				});
			}
		} else {
			keys.forEach(key => {
				if (hide.indexOf(key) === -1 && key.substring(0,2) !== '--' && data[key].indexOf('<<snippet') !== -1) {
					var s = key + '##' + title;
					results.push(s);
				}
			});
		}
	}
	return results;
}

/*
Export our filter function
*/
exports.map = function(source,operator,options) {
	var finalResults = [];
	source(function(tiddler,title) {
		if (title.indexOf('##') !== -1) {
			var s = title.split('##');
			$tw.utils.pushTop(finalResults,getSnippetsData(s[1],s[0],options));
		} else if (tiddler) {
			if (tiddler.fields['type'] === 'application/x-tiddler-dictionary') {
				$tw.utils.pushTop(finalResults,getKeys(tiddler,title,operator,options));
			} else if (tiddler.fields['type'] === 'text/vnd.tiddlywiki') {
				$tw.utils.pushTop(finalResults,getSnippetsRecord(title,options));
			}
		}
	});
	return finalResults;
};

})();
