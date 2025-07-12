/*\
title: $:/custom/filter/field-insensitive.js
type: application/javascript
tags: customized
module-type: filteroperator

Filter operator for comparing fields for equality (case insensitive version)

\*/
"use strict";

/*
Export our filter function
*/
exports.fieldInsensitive = function(source,operator,options) {
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
