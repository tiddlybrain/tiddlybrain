/*\
title: $:/custom/filter/recently-closed.js
type: application/javascript
tags: customized
module-type: filteroperator

Get a list of recently closed tiddlers from $:/HistoryList

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.recentlyClosed = function(source,operator,options) {
	var listOfClosed = [], historyList = [], history = "$:/HistoryList", story = "$:/StoryList";
	var listOfOpened = $tw.utils.parseStringArray(options.wiki.getTiddler(story).getFieldString("list"));
	var historyTiddler = options.wiki.getTiddler(history);
	if(historyTiddler) historyList = JSON.parse(historyTiddler.getFieldString("text")).reverse();
	historyList.forEach(function(item) {
		var title = item.title;
		if(title.indexOf("Draft of") === -1 && listOfClosed.indexOf(title) === -1 && listOfOpened.indexOf(title) === -1) {
			listOfClosed.push(title);
		}
	});
	return listOfClosed;
};

})();
