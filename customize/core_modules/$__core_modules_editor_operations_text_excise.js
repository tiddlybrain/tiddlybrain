/*\
title: $:/core/modules/editor/operations/text/excise.js
type: application/javascript
tags: customized
module-type: texteditoroperation

Text editor operation to excise the selection to a new tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["excise"] = function(event,operation) {
	var editTiddler = this.wiki.getTiddler(this.editTitle), editTiddlerType = editTiddler.fields.type;
	var excisionTitle = event.paramObject.title, caption = event.paramObject.caption, field = "text";
	this.wiki.setText(excisionTitle, field, null, operation.text.substring(operation.selStart,operation.selEnd));
	if(editTiddlerType === "application/x-tiddler-dictionary") {
		operation.replacement = excisionTitle;
	} else {
		operation.replacement = `<<l "${excisionTitle}" "${caption}" mode:cl tag:h3>>`;
	}
	operation.cutStart = operation.selStart;
	operation.cutEnd = operation.selEnd;
	operation.newSelStart = operation.selStart;
	operation.newSelEnd = operation.selStart + operation.replacement.length;
};

})();
