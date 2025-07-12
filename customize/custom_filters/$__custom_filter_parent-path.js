/*\
title: $:/custom/filter/parent-path.js
type: application/javascript
tags: customized
module-type: filteroperator

Remove the last item from the branch tiddlers
e.g. This/is/a/long/title/example/with/slashes -> This/is/a/long/title/example/with/

[<path>parentPath[]]

Find the valid parent tiddler of the current branch tiddler

[<path>parentPath[valid]]

\*/
"use strict";

/*
Export our filter function
*/
exports.parentPath = function(source,operator,options) {
	var results = [], pos, parentTitle;
	source(function(tiddler,title) {
		switch(operator.operand) {
			case "valid":
				do {
					pos = title.lastIndexOf("/");
					if(pos === -1) break;
					parentTitle = title.substring(0, pos);
					if(options.wiki.tiddlerExists(parentTitle)) {
						results.push(parentTitle);
						pos = -1;
					} else {
						title = parentTitle;
					}
				}
				while (pos !== -1);
				break;
			default:
				pos = title.lastIndexOf("/");
				parentTitle = title.substring(0, pos+1);
				results.push(parentTitle);
		}
	});
	return results;
};
