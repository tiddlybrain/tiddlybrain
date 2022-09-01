/*\
title: $:/custom/filter/tagging-or-prefixed.js
type: application/javascript
tags: customized
module-type: filteroperator

Return tiddlers that either tag the current tiddler or prefixed with the current tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.taggingOrPrefixed = function(source,operator,options) {
	var results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
		if (tiddler) {
			results.pushTop(options.wiki.getTiddlersWithTag(title));
			options.wiki.each(function(newTiddler,newTitle) {
				if(newTitle.indexOf(title) === 0 && newTitle.slice(title.length).lastIndexOf('/') === 0) {
					results.push(newTitle);
				}
			});
		}
	});
	return results.toArray();
};

})();
