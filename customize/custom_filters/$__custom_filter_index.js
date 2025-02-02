/*\
title: $:/custom/filter/index.js
type: application/javascript
tags: customized
module-type: filteroperator

1. Filter tiddlers by the given key and value, e.g. [[tiddlers]index:key[value]]
2. Filter tiddlers by the given key and value, e.g. [[tiddlers]indexSearch:key[value]]
3. Filter tiddlers by the given key and regex pattern, e.g. [[tiddlers]indexreg:key[regexp]]
4. Return the value of a given index, value parsed, e.g. [[tiddlers]getindexParsed[key]]
5. Branch Tiddler Constructor Filter, e.g. [slash:index[a]slash:field[b]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Helper functions
*/
var backlinkTester = {};

backlinkTester["note"] = function(tiddler,text) {
	if ($tw.utils.hop(tiddler.fields,'note') && tiddler.fields['note'] === text) {
		return true;
	} else {
		return false;
	}
}

var getResult = function(data,options,currTiddlerTitle) {
	if(options.wiki.tiddlerExists(data)) {
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
			}
		});
	}
}

var getBacklinksParsed = function(data,options,currTiddlerTitle) {
	var pattern = "(\\[\\[|\\||;;|\"|\'|:|\\s|#|^)" + currTiddlerTitle + "(\\]\\]|;;|\"|\'|:|\\s|\\n|$)", re = new RegExp(pattern);
	var re_filter = /<<bl-(.+?)\s+param:["'](.+?)["']/, filter = data.match(re_filter), tester = null, results = [];
	if(filter !== null && filter[1] in backlinkTester) {
		tester = backlinkTester[filter[1]];
	}
	options.wiki.each(function(newTiddler,newTitle) {
		if(tester === null || tester(newTiddler, filter[2])) {
			let content = newTiddler.getFieldString("text");
			if(re.test(content)) {
				results.push(getResult(newTitle,options,currTiddlerTitle));
			}
		}
	});
	return results;
}

var getResults = function(data,options,currTiddlerTitle) {
	var results = [], re = /\s*(?:;;)\s*/;
	data.split(re).forEach(datum => {
		if(datum !== "") {
			if(datum.indexOf("<<bl") !== -1) {
				results = results.concat(getBacklinksParsed(datum,options,currTiddlerTitle));
			} else {
				let result = getResult(datum,options,currTiddlerTitle);
				if(result !== null) {
					if(result.indexOf(";;") === -1) {
						results.push(result);
					} else {
						results = results.concat(getResults(result,options,currTiddlerTitle));
					}
				}
			}
		}
	});
	return results;
}

var getCellData = function(tiddler,index,options) {
	var data = options.wiki.extractTiddlerDataItem(tiddler,index) || "";
	if(data === "") {
		var celltpl = tiddler.getFieldString("celltpl");
		if(options.wiki.tiddlerExists(celltpl)) data = options.wiki.extractTiddlerDataItem(celltpl,index) || "";
	}
	return data;
}

/*
Export our filter function
*/
exports.index = function(source,operator,options) {
	var results = [], invert = operator.prefix === "!", value = operator.operand || "";
	var suffixes = operator.suffixes || [], index = (suffixes[0] || [])[0], flags = suffixes[1] || [];
	source(function(tiddler,title) {
		if(index && tiddler) {
			var data = getCellData(tiddler,index,options);
			if(flags.indexOf("literal") === -1) data = getResults(data,options,title).join('');
			if(invert) {
				if(data !== value) results.push(title);
			} else {
				if(data === value) results.push(title);
			}
		}
	});
	return results;
};

exports.indexSearch = function(source,operator,options) {
	var results = [], invert = operator.prefix === "!", value = operator.operand || "";
	var suffixes = operator.suffixes || [], index = (suffixes[0] || [])[0], flags = suffixes[1] || [];
	source(function(tiddler,title) {
		if(index && tiddler) {
			var data = getCellData(tiddler,index,options);
			if(flags.indexOf("literal") === -1) data = getResults(data,options,title).join('');
			if(value === "#") {
				if(invert) {
					if(data !== "") results.push(title);
				} else {
					if(data === "") results.push(title);
				}
			} else if(value === "*") {
				if(invert) {
					if(data === "") results.push(title);
				} else {
					if(data !== "") results.push(title);
				}
			} else {
				if(invert) {
					if(data.indexOf(value) === -1) results.push(title);
				} else {
					if(data.indexOf(value) !== -1) results.push(title);
				}
			}
		}
	});
	return results;
};

exports.indexRegex = function(source,operator,options) {
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
			if(index && tiddler) {
				var data = getCellData(tiddler,index,options), match;
				if(flags.indexOf("transform") !== -1) data = getResults(data,options,title).join('');
				match = regexp.test(data);
				if(invert) match = !match;
				if(match) results.push(title);
			}
		});
		return results;
	}
};

exports.getindexParsed = function(source,operator,options) {
	var results = [], data, index = operator.operand || null, s;
	var suffixes = operator.suffixes || [], separator = (suffixes[0] || [])[0];
	switch(separator) {
		case 'comma':
			s = ',';
			break;
		case 'space':
			s = ' ';
			break;
		case 'commaspace':
			s = ', ';
			break;
		case 'br':
			s = '<br>';
			break;
		default:
			s = '';
	}
	if(index !== null) {
		source(function(tiddler,title) {
			if(tiddler) {
				data = getCellData(tiddler,index,options);
				if(data) {
					data = getResults(data,options,title).join(s);
					results.push(data);
				}
			}
		});
	}
	return results;
};

exports.slash = function(source,operator,options) {
	var results = [], result, key = operator.operand || "", data, currTiddler;
	var suffixes = operator.suffixes || [], mode = (suffixes[0] || [])[0], flags = suffixes[1] || [];
	var currTiddlerTitle = options.widget && options.widget.getVariable("currentTiddler");
	if(currTiddlerTitle) switch(mode) {
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
		case "date":
			currTiddler = options.wiki.getTiddler(currTiddlerTitle);
			data = currTiddler.getFieldString("date") || currTiddler.getFieldString("created");
			result = $tw.utils.formatDateString($tw.utils.parseDate(data),key);
			source(function(tiddler,title) {
				results.push(title + "/" + result);
			});
			break;
		case "links":
			let pattern = /<<l\s+["'](.+?)["'].*?>>|\[\[.+?\|(.+?)\]\]|\[\[(.+?)\]\]/g, matches, hasResults = 0;
			currTiddler = options.wiki.getTiddler(currTiddlerTitle);
			data = currTiddler.getFieldString("text");
			while(matches = pattern.exec(data)) {
				matches.shift();
				matches.forEach(match => {
					if (match !== undefined && options.wiki.tiddlerExists(match)) {
						hasResults = 1;
						let caption = options.wiki.getTiddler(match).getFieldString("caption") || match;
						result = options.wiki.renderText("text/plain","text/vnd.tiddlywiki",caption,{
							parseAsInline: true,
							variables: {
								currentTiddler: match
							},
							parentWidget: options.widget
						});
						source(function(tiddler,title) {
							results.push(title + "/" + result);
						});
					}
				});
			}
			if(hasResults === 0) {
				result = (flags.indexOf("optional") === -1) ? "/Others" : "";
				source(function(tiddler,title) {
					results.push(title + result);
				});
			}
			break;
		case "field":
			data = options.wiki.getTiddler(currTiddlerTitle).getFieldString(key) || null;
			if(data === null) {
				result = (flags.indexOf("optional") === -1) ? "/Others" : "";
				source(function(tiddler,title) {
					results.push(title + result);
				});
			} else {
				if(flags.indexOf("list") === -1) {
					result = "/" + getResult(data,options,currTiddlerTitle);
					source(function(tiddler,title) {
						results.push(title + result);
					});
				} else {
					$tw.utils.parseStringArray(data).forEach(item => {
						result = "/" + getResult(item,options,currTiddlerTitle);
						source(function(tiddler,title) {
							results.push(title + result);
						});
					});
				}
			}
			break;
		default: //index
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
	}
	return results;
};

})();
