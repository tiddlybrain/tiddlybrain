/*\
title: $:/core/modules/filters/indexes.js
type: application/javascript
tags: customized
module-type: filteroperator

Filter operator for returning the indexes of a data tiddler

\*/
"use strict";

/*
Export our filter function
*/
exports.indexes = function(source,operator,options) {
	var results = [], opt = operator.suffix;
	source(function(tiddler,title) {
		if(tiddler) {
			var data = options.wiki.getTiddlerDataCached(title);
			if(data) {
				if (opt === "non-empty") {
					var k = [], celltpl = tiddler.getFieldString("celltpl");
					if(options.wiki.tiddlerExists(celltpl)) {
						let tpltid = options.wiki.getTiddler(celltpl);
						if (tpltid.getFieldString("type") === "application/x-tiddler-dictionary") {
							k = Object.keys(options.wiki.getTiddlerDataCached(celltpl) || {});
						} else {
							const regex = /\[<key>match\[(.*?)\]\]/g;
							let tplcontent = tpltid.getFieldString("text");
							k = [...tplcontent.matchAll(regex)].map(m => m[1]);
						}
					}
					Object.keys(data).forEach(key => {
						if (data[key].length !== 0 || k.indexOf(key) !== -1) results.push(key);
					});
				} else {
					$tw.utils.pushTop(results,Object.keys(data));
				}
			}
		}
	});
	return results;
};
