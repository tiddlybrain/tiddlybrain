/*\
title: $:/custom/filter/fieldinsensitive.js
type: application/javascript
tags: customized
module-type: filteroperator

Filter operator for comparing fields for equality (case insensitive version)

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.fieldCaseInsensitive = function(source,operator,options) {
	var results = [], fieldname = operator.suffix || operator.operator || "title";
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(tiddler) {
				var text = tiddler.getFieldString(fieldname);
				if(text !== null && text.toLowerCase() !== operator.operand.toLowerCase()) {
					results.push(title);
				}
			} else {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(tiddler) {
				var text = tiddler.getFieldString(fieldname);
				if(text !== null && text.toLowerCase() === operator.operand.toLowerCase()) {
					results.push(title);
				}
			}
		});
	}
	return results;
};

})();
