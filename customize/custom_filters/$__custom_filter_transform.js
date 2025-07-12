/*\
title: $:/custom/filter/transform.js
type: application/javascript
tags: customized
module-type: filteroperator

Tranform input titles to another form defined by operand filters

\*/
"use strict";

/*
Export our filter function
*/
exports.transform = function(source,operator,options) {
	var filterFn = options.wiki.compileFilter(operator.operand), results = [];
	source(function(tiddler,title) {
		if (tiddler) {
			var list = filterFn.call(options.wiki,options.wiki.makeTiddlerIterator([title]),{
				getVariable: function(name) {
					switch(name) {
						case "currentTiddler":
							return "" + title;
						case "..currentTiddler":
							return options.widget.getVariable("currentTiddler");
						default:
							return options.widget.getVariable(name);
					}
				}
			});
			$tw.utils.pushTop(results, list);
		}
	});
	return results;
};
