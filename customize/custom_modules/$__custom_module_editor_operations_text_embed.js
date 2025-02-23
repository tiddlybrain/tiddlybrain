/*\
title: $:/custom/module/editor/operations/text/embed.js
type: application/javascript
tags: customized
module-type: texteditoroperation

Text editor operation to embed an external file to a tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["embed"] = function(event,operation) {
	var defaultTemplateTiddler = this.wiki.getTiddler("$:/language/DefaultNewTiddlerTitle"),
		defaultTemplate = defaultTemplateTiddler.fields.text || "New Tiddler",
		embedTitle = this.wiki.generateNewTitle(defaultTemplate),
		tiddlerParams = {
			title: embedTitle,
			caption: event.paramObject.caption,
			type: event.paramObject.type,
			tags: ["Snippet"]
		};
	tiddlerParams["_canonical_uri"] = event.paramObject.uri;
	tiddlerParams["belongs.to"] =  "Attachments";
	switch(event.paramObject.type) {
		case "image/jpeg":
			tiddlerParams["note"] = "JPG";
			break;
		case "image/png":
			tiddlerParams["note"] = "PNG";
			break;
		case "image/gif":
			tiddlerParams["note"] = "GIF";
			break;
		case "image/svg+xml":
			tiddlerParams["note"] = "SVG";
			break;
		case "application/pdf":
			tiddlerParams["note"] = "PDF";
			break;
		case "text/html":
			tiddlerParams["note"] = "HTML";
			break;
		case "audio/mp3":
			tiddlerParams["note"] = "MP3";
			break;
		case "video/mp4":
			tiddlerParams["note"] = "MP4";
			break;
	}
	this.wiki.addTiddler(new $tw.Tiddler(
		this.wiki.getCreationFields(),
		this.wiki.getModificationFields(),
		tiddlerParams
	));
	var caption = operation.selection || tiddlerParams.caption;
	operation.replacement = `<<l "${embedTitle}" "${caption}" mode:tr style:"text-align:center;">>`;
	operation.cutStart = operation.selStart;
	operation.cutEnd = operation.selEnd;
	operation.newSelStart = operation.selStart;
	operation.newSelEnd = operation.selStart + operation.replacement.length;
};

})();
