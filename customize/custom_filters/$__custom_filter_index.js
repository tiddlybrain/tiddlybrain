/*\
title: $:/custom/filter/index.js
type: application/javascript
tags: customized
module-type: filteroperator

1. Filter tiddlers by the given key and value, e.g. [[tiddlers]index:key[value]]
2. Filter tiddlers by the given key and regex pattern, e.g. [[tiddlers]indexreg:key[regexp]]
3. Return the value of a given index, value parsed, e.g. [[tiddlers]getindexParsed[key]]
4. Return the value of a given index, value parsed & joined, e.g. [[tiddlers]getindexJoined[key]]
5. Branch Tiddler Constructor Filter, e.g. [slash:index[a]slash:field[b]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Helper functions
*/
var getResult = function(data,options,currTiddlerTitle) {
	if (options.wiki.tiddlerExists(data)) {
		var content = options.wiki.getTiddler(data).getFieldString("caption") || data;
		return options.wiki.renderText("text/plain","text/vnd.tiddlywiki",content,{
			parseAsInline: true,
			variables: {
				currentTiddler: data
			},
			parentWidget: options.widget
		});
	} else {
		return options.wiki.renderText("text/plain","text/vnd.tiddlywiki",data,{
			parseAsInline: true,
			variables: {
				currentTiddler: currTiddlerTitle
			},
			parentWidget: options.widget
		});
	}
}

var getResults = function(data,options,currTiddlerTitle) {
	var result, results = [], re = /\s*(?:;;|$)\s*/;
	data.split(re).forEach(datum => {
		if (datum !== "") {
			result = getResult(datum,options,currTiddlerTitle);
			if(result.indexOf(";;") === -1) {
				results.push(result);
			} else {
				results = results.concat(getResults(result,options,currTiddlerTitle));
			}
		}
	});
	return results;
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
			if(flags.indexOf("literal") === -1) data = getResults(data,options,title).join('');
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
				var data = options.wiki.extractTiddlerDataItem(tiddler,index) || "", match;
				if(flags.indexOf("transform") !== -1) data = getResults(data,options,title).join('');
				match = regexp.test(data);
				if(invert) match = !match;
				if(match) results.push(title);
			} else {
				results.push(title);
			}
		});
		return results;
	}
};

exports.getindexParsed = function(source,operator,options) {
	var results = [], data, index = operator.operand || null, s;
	var suffixes = operator.suffixes || [], separator = (suffixes[0] || [])[0];
	switch (separator) {
		case 'comma':
			s = ',';
			break;
		case 'space':
			s = ' ';
			break;
		case 'commaspace':
			s = ', ';
			break;
		default:
			s = '';
	}
	if(index !== null) {
		source(function(tiddler,title) {
			title = tiddler ? tiddler.fields.title : title;
			data = options.wiki.extractTiddlerDataItem(tiddler,index) || "";
			if(data) {
				data = getResults(data,options,title).join(s);
				results.push(data);
			}
		});
	}
	return results;
};

exports.slash = function(source,operator,options) {
	var results = [], result, key = operator.operand || "", data, re = /\s*(?:;;|$)\s*/;
	var suffixes = operator.suffixes || [], mode = (suffixes[0] || [])[0], flags = suffixes[1] || [];
	var currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler");
	if(currTiddlerTitle) switch(mode) {
		case "index":
			data = options.wiki.extractTiddlerDataItem(currTiddlerTitle,key) || null;
			if(data === null) {
				result = (flags.indexOf("optional") === -1) ? "/Others" : "";
				source(function(tiddler,title) {
					results.push(title + result);
				});
			} else {
				getResults(data,options,currTiddlerTitle).forEach(result => {
					source(function(tiddler,title) {
						results.push(title + "/" + result);
					});
				});
			}
			break;
		case "parent":
			data = options.wiki.getTiddler(currTiddlerTitle).getFieldString("parents") || "";
			let parentsArray = $tw.utils.parseStringArray(data).reverse(), level = key - 1;
			if(parentsArray[level] === undefined) {
				result = (flags.indexOf("optional") === -1) ? "/Others" : "";
			} else {
				result = "/" + getResult(parentsArray[level],options,currTiddlerTitle);
			}
			source(function(tiddler,title) {
				results.push(title + result);
			});
			break;
		default:
			data = options.wiki.getTiddler(currTiddlerTitle).getFieldString(key) || null;
			if(data === null) {
				result = (flags.indexOf("optional") === -1) ? "/Others" : "";
			} else {
				result = "/" + getResult(data,options,currTiddlerTitle);
			}
			source(function(tiddler,title) {
				results.push(title + result);
			});
	}
	return results;
};

})();
