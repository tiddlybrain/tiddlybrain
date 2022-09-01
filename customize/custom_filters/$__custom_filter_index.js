/*\
title: $:/custom/filter/index.js
type: application/javascript
tags: customized
module-type: filteroperator

1. filter tiddlers by the given key and value, e.g. [!is[system]index:key[value]]
2. filter tiddlers by the given key and value, but see value as a title list, e.g. [!is[system]indexList:key[value]]
3. Return value of a given index, value parsed, e.g. [[tiddler]getindexParsed[key]]
4. Return values of given indexes, value parsed, e.g. [[tiddler]getindexes[keys list]]
5. Return index names by matching value, e.g. [[tiddler]searchindexes:mainTiddler[value]]
6. Return index names by matching value, but see value as a title list, e.g. [[tiddler]searchindexesList:mainTiddler[value]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Helper functions
*/
var transform = function(data,options,title) {
	var parsed_string;
	var pattern_render = /(<\$.+>|<<.+>>|{{{\s?\[.+\]\s?}}})/, pattern_transclude = /{{(.+)}}/;
	if (pattern_render.test(data)) {
		parsed_string = data.match(pattern_render)[1];
		return options.wiki.renderText("text/plain","text/vnd.tiddlywiki",parsed_string,{
			parseAsInline: true,
			variables: {
				currentTiddler: title
			},
			parentWidget: options.widget
		});
	} else if (pattern_transclude.test(data)) {
		parsed_string = data.match(pattern_transclude)[1];
		return options.wiki.getTextReference(parsed_string,"",title);
	} else {
		return data;
	}
}

/*
Export our filter function
*/
exports.index = function(source,operator,options) {
	var results = [], invert = operator.prefix === "!", value = operator.operand || "";
	var index = operator.suffixes[0], flag = operator.suffixes[1];
	source(function(tiddler,title) {
		title = tiddler ? tiddler.fields.title : title;
		if(index) {
			var data = options.wiki.extractTiddlerDataItem(tiddler,index) || "";
			if(flag !== "literal") data = transform(data,options,title);
			if(invert) {
				if(data !== value) results.push(title);
			} else {
				if(data === value) results.push(title);
			}
		} else {
			results.push(title);
		}
	});
	return results;
};

exports.indexList = function(source,operator,options) {
	var results = [], invert = operator.prefix === "!", index = operator.suffix || "", value = operator.operand || "", allowDuplicates = false;
	source(function(tiddler,title) {
		title = tiddler ? tiddler.fields.title : title;
		if(index) {
			var data = options.wiki.extractTiddlerDataItem(tiddler,index) || "";
			var list = $tw.utils.parseStringArray(data, allowDuplicates);
			if(invert) {
				if(list.indexOf(value) === -1) results.push(title);
			} else {
				if(list.indexOf(value) !== -1) results.push(title);
			}
		} else {
			results.push(title);
		}
	});
	return results;
};

exports.getindexParsed = function(source,operator,options) {
	var results = [], data, index = operator.operand || ""; 
	if(index){
		source(function(tiddler,title) {
			title = tiddler ? tiddler.fields.title : title;
			data = options.wiki.extractTiddlerDataItem(tiddler,index) || "";
			if(data) {
				data = transform(data,options,title);
				results.push(data);
			}
		});
	}
	return results;
};

exports.getindexes = function(source,operator,options) {
	var results = [], invert = operator.prefix === "!", indexes = [], allowDuplicates = false;
	if(!invert && operator.operand) indexes = $tw.utils.parseStringArray(operator.operand,allowDuplicates);
	source(function(tiddler,title) {
		var data, exclude;
		if(!invert && !operator.operand) {
			data = options.wiki.getTiddlerDataCached(title);
			if(data) indexes = Object.keys(data);
		}
		if(invert) {
			data = options.wiki.getTiddlerDataCached(title);
			if(data) {
				indexes = Object.keys(data);
				if(operator.operand) {
					exclude = $tw.utils.parseStringArray(operator.operand,allowDuplicates);
					indexes = indexes.filter((index) => {
						return exclude.indexOf(index) === -1;
					});
				}
			}

		}
		for (var index of indexes) {
			var value = options.wiki.extractTiddlerDataItem(tiddler,index);
			if(value) {
				if(operator.suffix === "list") {
					var list = $tw.utils.parseStringArray(value, false) || [];
					results = results.concat(list);
				} else {
					value = transform(value,options,title);
					results.push(value);
				}
			}
		}
	});
	return results;
};

exports.searchindexes = function(source,operator,options) {
	var results = [], invert = operator.prefix === "!", searchValue = operator.operand || "", main = operator.suffix, mainData;
	if(main && (mainData = options.wiki.getTiddlerDataCached(main))) {
		var mainIndexes = Object.keys(mainData);
		source(function(tiddler,title) {
			var data = options.wiki.getTiddlerDataCached(title);
			if(data) Object.entries(data).forEach(([index, value]) => {
				if (invert) {
					if(value !== searchValue && mainIndexes.indexOf(index) !== -1 && results.indexOf(index) === -1) results.push(index);
				} else {
					if(value === searchValue && mainIndexes.indexOf(index) !== -1 && results.indexOf(index) === -1) results.push(index);
				}
			});
		});
	} else {
		source(function(tiddler,title) {
			var data = options.wiki.getTiddlerDataCached(title);
			if(data) Object.entries(data).forEach(([index, value]) => {
				if (invert) {
					if(value !== searchValue && results.indexOf(index) === -1) results.push(index);
				} else {
					if(value === searchValue && results.indexOf(index) === -1) results.push(index);
				}
			});
		});
	}
	return results;
};

exports.searchindexesList = function(source,operator,options) {
	var results = [], invert = operator.prefix === "!", searchValue = operator.operand || "", main = operator.suffix, mainData;
	if(main && (mainData = options.wiki.getTiddlerDataCached(main))) {
		var mainIndexes = Object.keys(mainData);
		source(function(tiddler,title) {
			var data = options.wiki.getTiddlerDataCached(title);
			if(data) Object.entries(data).forEach(([index, value]) => {
				var list = $tw.utils.parseStringArray(value, false);
				if (invert) {
					if(list.indexOf(searchValue) === -1 && mainIndexes.indexOf(index) !== -1 && results.indexOf(index) === -1) results.push(index);
				} else {
					if(list.indexOf(searchValue) !== -1 && mainIndexes.indexOf(index) !== -1 && results.indexOf(index) === -1) results.push(index);
				}
			});
		});
	} else {
		source(function(tiddler,title) {
			var data = options.wiki.getTiddlerDataCached(title);
			if(data) Object.entries(data).forEach(([index, value]) => {
				var list = $tw.utils.parseStringArray(value, false);
				if (invert) {
					if(list.indexOf(searchValue) === -1 && results.indexOf(index) === -1) results.push(index);
				} else {
					if(list.indexOf(searchValue) !== -1 && results.indexOf(index) === -1) results.push(index);
				}
			});
		});
	}
	return results;
};

})();
