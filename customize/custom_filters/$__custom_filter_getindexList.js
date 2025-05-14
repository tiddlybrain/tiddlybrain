/*\
title: $:/custom/filter/getindexList.js
type: application/javascript
tags: customized
module-type: filteroperator

Return the values of an index, value unparsed, e.g. [[tiddlers]getindexList[key]]

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
		return data;
	} else {
		return options.wiki.renderText("text/plain","text/vnd.tiddlywiki",data,{
			parseAsInline: true,
			variables: {
				currentTiddler: currTiddlerTitle
			}
		}).trim();
	}
}

var getBacklinks = function(data,options,currTiddlerTitle) {
	var pattern = "(\\[\\[|\\||;;|\"|\'|:|\\s|#|^)" + currTiddlerTitle + "(\\]\\]|;;|\"|\'|:|\\s|\\n|$)", re = new RegExp(pattern);
	var re_filter = /<<bl-(.+?)\s+param:["'](.+?)["']/, filter = data.match(re_filter), tester = null, results = [];
	if(filter !== null && filter[1] in backlinkTester) {
		tester = backlinkTester[filter[1]];
	}
	options.wiki.each(function(newTiddler,newTitle) {
		if(tester === null || tester(newTiddler, filter[2])) {
			let content = newTiddler.getFieldString("text");
			if(re.test(content)) {
				results.push(newTitle);
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
				results = results.concat(getBacklinks(datum,options,currTiddlerTitle));
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
exports.getindexList = function(source,operator,options) {
	var results = [], data, index = operator.operand || null;
	if(index !== null) {
		source(function(tiddler,title) {
			if(tiddler) {
				data = getCellData(tiddler,index,options);
				if(data) {
					results = results.concat(getResults(data,options,title));
				}
			}
		});
	}
	return results;
};

})();
