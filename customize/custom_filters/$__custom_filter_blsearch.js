/*\
title: $:/custom/filter/blsearch.js
type: application/javascript
tags: customized
module-type: filteroperator

Search all backlinks of the input tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Helper functions
*/
var getBacklinksIterator = function(source,options) {
	var results = [];
	source(function(tiddler,title) {
		var pattern = "(\\[\\[|\\||;;|\"|\'|:|\\s|^)" + title + "(\\]\\]|;;|\"|\'|:|\\s|\\n|$)", re = new RegExp(pattern);
		options.wiki.each(function(newTiddler,newTitle) {
			let content = newTiddler.getFieldString("text");
			if(re.test(content)) {
				results.push(newTitle);
			}
		});
	});
	return options.wiki.makeTiddlerIterator(results);
}

/*
Export our filter function
*/
exports.blsearch = function(source,operator,options) {
	var newsource = getBacklinksIterator(source,options);
	var invert = operator.prefix === "!";
	if(operator.suffixes) {
		var hasFlag = function(flag) {
				return (operator.suffixes[1] || []).indexOf(flag) !== -1;
			},
			excludeFields = false,
			fieldList = operator.suffixes[0] || [],
			firstField = fieldList[0] || "",
			firstChar = firstField.charAt(0),
			fields;
		if(firstChar === "-") {
			fields = [firstField.slice(1)].concat(fieldList.slice(1));
			excludeFields = true;
		} else if(fieldList[0] === "*"){
			fields = [];
			excludeFields = true;
		} else {
			fields = fieldList.slice(0);
		}
		return options.wiki.search(operator.operand,{
			source: newsource,
			invert: invert,
			field: fields,
			excludeField: excludeFields,
			some: hasFlag("some"),
			caseSensitive: hasFlag("casesensitive"),
			literal: hasFlag("literal"),
			whitespace: hasFlag("whitespace"),
			anchored: hasFlag("anchored"),
			regexp: hasFlag("regexp"),
			words: hasFlag("words")
		});
	} else {
		return options.wiki.search(operator.operand,{
			source: newsource,
			invert: invert
		});
	}
};

})();
