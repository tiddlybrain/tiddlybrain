/*\
title: $:/custom/module/editor/operations/text/insert-link.js
type: application/javascript
tags: customized
module-type: texteditoroperation

Text editor operation to insert a link

\*/
"use strict";

exports["insert-link"] = function(event,operation) {
	var editTiddler = this.wiki.getTiddler(this.editTitle), editTiddlerType = editTiddler.fields.type;
	if(editTiddlerType === "application/x-tiddler-dictionary") {
		operation.replacement = event.paramObject.title;
	} else {
		let tiddler = this.wiki.getTiddler(event.paramObject.title);
		if(tiddler) {
			let title = event.paramObject.title, caption = operation.selection || tiddler.fields.caption;
			operation.replacement = `<<l "${title}" "${caption}">>`;
		} else {
			operation.replacement = operation.selection;
		}
	}
	operation.cutStart = operation.selStart;
	operation.cutEnd = operation.selEnd;
	operation.newSelStart = operation.selStart;
	operation.newSelEnd = operation.selStart + operation.replacement.length;
};
