/*\
title: $:/custom/filter/next-day.js
type: application/javascript
tags: customized
module-type: filteroperator

Calculate a new date based on date difference

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Helper functions
*/
function addDays(date, days) {
	var result = new Date(date.valueOf());
	result.setDate(result.getDate() + days);
	return result;
}

/*
Export our filter function
*/
exports.nextDay = function(source,operator,options) {
	var results = [], numDays = parseInt(operator.operand || "0");
	if (Number.isInteger(numDays)) source(function(tiddler,title) {
		var value = $tw.utils.parseDate(title);
		if (value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
			var newDate = addDays(value, numDays);
			results.push($tw.utils.formatDateString(newDate, "YYYY0MM0DD"));
		}
	});
	return results;
};

exports.getSunday = function(source,operator,options) {
	var results = [], numDays = parseInt(operator.operand || "0");
	if (Number.isInteger(numDays)) source(function(tiddler,title) {
		var value = $tw.utils.parseDate(title);
		if (value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
			var diff = -1 * value.getDay() + 7 * numDays;
			var newDate = addDays(value, diff);
			results.push($tw.utils.formatDateString(newDate, "YYYY0MM0DD"));
		}
	});
	return results;
};

})();
