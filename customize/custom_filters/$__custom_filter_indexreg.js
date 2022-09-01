/*\
title: $:/custom/filter/indexreg.js
type: application/javascript
tags: customized
module-type: filteroperator

Check the value of a given key that matches the regex pattern

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
exports.indexreg = function(source,operator,options) {
	var results = [], regexpString = operator.operand, regexp, flags;
	if(regexpString) {
		// Process flags and construct regexp
		var match = /^\(\?([gim]+)\)/.exec(regexpString);
		if(match) {
			flags = match[1];
			regexpString = regexpString.substr(match[0].length);
		} else {
			match = /\(\?([gim]+)\)$/.exec(regexpString);
			if(match) {
				flags = match[1];
				regexpString = regexpString.substr(0,regexpString.length - match[0].length);
			}
		}
		try {
			regexp = new RegExp(regexpString,flags);
		} catch(e) {
			return ["" + e];
		}
		// Process the incoming tiddlers
		var index = operator.suffixes[0], flag = operator.suffixes[1], invert = operator.prefix === "!";
		source(function(tiddler,title) {
			title = tiddler ? tiddler.fields.title : title;
			if(index) {
				var data = options.wiki.extractTiddlerDataItem(tiddler,index) || "", match = false;
				if(flag === "transform") data = transform(data,options,title);
				if(regexp.test(data)) match = true;
				if(invert) match = !match;
				if(match) results.push(title);
			}
		});
		return results;
	}
};

})();
