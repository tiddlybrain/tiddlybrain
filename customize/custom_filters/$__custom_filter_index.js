/*\
title: $:/custom/filter/index.js
type: application/javascript
tags: customized
module-type: filteroperator

1. filter tiddlers by the given key and value, e.g. [!is[system]index:key[value]]
2. Return value of a given index, value parsed, e.g. [[tiddler]getindexParsed[key]]
3. Return values of given indexes, value parsed, e.g. [[tiddler]getindexes[keys list]]
4. Return index names by matching value, e.g. [[tiddler]searchindexes:mainTiddler[value]]
5. Check the value of a given key that matches the regex pattern
6. Branch Tiddler Constructor Filter, e.g. [slash:index[a]slash:field[b]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Helper functions
*/
var transform = function(data,options,title) {
	var pattern_render = /<\$.+>|<<.+>>|{{.+}}/;
	if (pattern_render.test(data)) {
		return options.wiki.renderText("text/plain","text/vnd.tiddlywiki",data,{
			parseAsInline: true,
			variables: {
				currentTiddler: title
			},
			parentWidget: options.widget
		});
	} else {
		return data;
	}
}

var getResult = function(data,options,currTiddlerTitle) {
	var result;
	if (options.wiki.tiddlerExists(data)) {
		var content = options.wiki.getTiddler(data).getFieldString("caption") || data;
		result = transform(content,options,data);
	} else {
		result = transform(data,options,currTiddlerTitle);
	}
	return result;
}

/*
Export our filter function
*/
exports.index = function(source,operator,options) {
	var results = [], invert = operator.prefix === "!", value = operator.operand || "";
	var suffixes = operator.suffixes || [], index = (suffixes[0] || [])[0], flags = suffixes[1] || [];
	source(function(tiddler,title) {
		title = tiddler ? tiddler.fields.title : title;
		if(index) {
			var data = options.wiki.extractTiddlerDataItem(tiddler,index) || "";
			if(flags.indexOf("literal") === -1) data = transform(data,options,title);
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
	var suffixes = operator.suffixes || [], flags = suffixes[0] || [];
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
				if(flags.indexOf("list") !== -1) {
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
	var results = [], invert = operator.prefix === "!", searchValue = operator.operand || "";
	var suffixes = operator.suffixes || [], main = (suffixes[0] || [])[0], mainData;
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

exports.indexreg = function(source,operator,options) {
	var results = [], invert = operator.prefix === "!", regexpString = operator.operand, regexp, regflags;
	if(regexpString) {
		// Process flags and construct regexp
		var match = /^\(\?([gim]+)\)/.exec(regexpString);
		if(match) {
			regflags = match[1];
			regexpString = regexpString.substr(match[0].length);
		} else {
			match = /\(\?([gim]+)\)$/.exec(regexpString);
			if(match) {
				regflags = match[1];
				regexpString = regexpString.substr(0,regexpString.length - match[0].length);
			}
		}
		try {
			regexp = new RegExp(regexpString,regflags);
		} catch(e) {
			return ["" + e];
		}
		// Process the incoming tiddlers
		var suffixes = operator.suffixes || [], index = (suffixes[0] || [])[0], flags = suffixes[1] || [];
		source(function(tiddler,title) {
			title = tiddler ? tiddler.fields.title : title;
			if(index) {
				var data = options.wiki.extractTiddlerDataItem(tiddler,index) || "", match = false;
				if(flags.indexOf("transform") !== -1) data = transform(data,options,title);
				if(regexp.test(data)) match = true;
				if(invert) match = !match;
				if(match) results.push(title);
			}
		});
		return results;
	}
};

exports.slash = function(source,operator,options) {
	var results = [], result, key = operator.operand || "", data, re = /\s*(?:;;|$)\s*/;
	var suffixes = operator.suffixes || [], mode = (suffixes[0] || [])[0];
	var currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler");
	if(currTiddlerTitle) switch(mode) {
		case "index":
			data = options.wiki.extractTiddlerDataItem(currTiddlerTitle,key) || null;
			if(data === null) {
				result = "Others";
				source(function(tiddler,title) {
					results.push(title + "/" + result);
				});
			} else if (data.indexOf(";;") !== -1) {
				data.split(re).forEach(datum => {
					if (datum !== "") {
						result = getResult(datum,options,currTiddlerTitle);
						source(function(tiddler,title) {
							results.push(title + "/" + result);
						});
					}
				});
			} else {
				result = getResult(data,options,currTiddlerTitle);
				if (result.indexOf(";;") !== -1) {
					data = result;
					data.split(re).forEach(datum => {
						if (datum !== "") {
							result = getResult(datum,options,currTiddlerTitle);
							source(function(tiddler,title) {
								results.push(title + "/" + result);
							});
						}
					});
				} else {
					source(function(tiddler,title) {
						results.push(title + "/" + result);
					});
				}
			}
			break;
		default:
			data = options.wiki.getTiddler(currTiddlerTitle).getFieldString(key) || null;
			if(data === null) {
				result = "Others";
				source(function(tiddler,title) {
					results.push(title + "/" + result);
				});
			} else {
				result = getResult(data,options,currTiddlerTitle);
				source(function(tiddler,title) {
					results.push(title + "/" + result);
				});
			}
	}
	return results;
};

})();
