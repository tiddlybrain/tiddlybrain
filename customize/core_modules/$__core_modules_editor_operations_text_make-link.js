/*\
title: $:/core/modules/editor/operations/text/make-link.js
type: application/javascript
tags: customized
module-type: texteditoroperation

Text editor operation to make a link

\*/
"use strict";

exports["make-link"] = function(event,operation) {
	var pattern = /^<<l\s+["'](.+?)["']/, re = new RegExp(pattern), title, is_link;
	if(re.test(operation.selection)) {
		title = operation.selection.match(pattern)[1];
		is_link = true;
	} else {
		title = operation.selection;
		is_link = false;
	}
	var tiddler = this.wiki.getTiddler(title);
	if(tiddler) {
		if(is_link) {
			operation.replacement = title;
		} else {
			let caption = tiddler.fields.caption;
			operation.replacement = caption === undefined ? `<<l "${title}">>` : `<<l "${title}" "${caption}">>`
		}
		operation.cutStart = operation.selStart;
		operation.cutEnd = operation.selEnd;
		operation.newSelStart = operation.selStart;
		operation.newSelEnd = operation.selStart + operation.replacement.length;
	}
};
