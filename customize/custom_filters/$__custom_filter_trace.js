/*\
title: $:/custom/filter/trace.js
type: application/javascript
tags: customized
module-type: filteroperator

trace: Find all conbinations of tiddlers that link tiddler A and B together, [[A]trace[B]enlist-input[]]
getAllSnippets: Find all child snippets of the current tiddler
getAllParents: Find all parent snippets of the current tiddler
getAllParentTitles: Find all parent snippets of the current tiddler, and return their captions

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Helper functions
*/
var tracer = function(current, target, finder, grandparent) {
	var results = [];
	finder(current).forEach(function(child) {
		if (child !== grandparent) {
			if (child === target) {
				results.push([child]);
			} else {
				tracer(child, target, finder, current).forEach(function(result) {
					result.unshift(child);
					results.push(result);
				});
			}
		}
	});
	return results;
}

var getSnippets = function(title,results,options) {
	var r = [];
	options.wiki.each(function(newTiddler,newTitle) {
		if ($tw.utils.hop(newTiddler.fields,'belongs.to') && newTiddler.fields['belongs.to'] === title) {
			results.push(newTitle);
			r.push(newTitle);
		}
	});
	r.forEach(title => getSnippets(title,results,options));
}

var getParents = function(tiddler,title,results,options) {
	results.push(title);
	var parentTitle = tiddler.getFieldString("belongs.to");
	if (parentTitle) {
		var parentTiddler = options.wiki.getTiddler(parentTitle);
		getParents(parentTiddler,parentTitle,results,options);
	}
}

var getParentTitles = function(tiddler,title,results,options) {
	var result = title, caption = tiddler.fields.caption;
	if (caption) result = options.wiki.renderText("text/plain","text/vnd.tiddlywiki",caption,{
		parseAsInline: true,
		variables: {
			currentTiddler: title
		}
	});
	results.push(result);
	var parentTitle = tiddler.getFieldString("belongs.to");
	if (parentTitle) {
		var parentTiddler = options.wiki.getTiddler(parentTitle);
		getParentTitles(parentTiddler,parentTitle,results,options);
	}
}

/*
Export our filter function
*/
exports.trace = function(source,operator,options) {
	var results = [], target = operator.operand;
	if (target) source(function(tiddler,title) {
		if (tiddler) {
			tracer(title, target, function(tid) {
				var tiddlers = [];
				$tw.utils.pushTop(tiddlers, options.wiki.getTiddlersWithTag(tid));
				return tiddlers;
			}).forEach(function(path) {
				path.unshift(title);
				results.push($tw.utils.stringifyList(path));
			});
		}
	});
	return results;
};

exports.getAllSnippets = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		getSnippets(title,results,options);
	});
	return results;
};

exports.getAllParents = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if (tiddler) getParents(tiddler,title,results,options);
	});
	return results;
};

exports.getAllParentTitles = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if (tiddler) getParentTitles(tiddler,title,results,options);
	});
	return results;
};

})();
