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

function addMonths(date, months) {
	var result = new Date(date.valueOf());
	result.setMonth(result.getMonth() + months);
	return result;
}

function addYears(date, years) {
	var result = new Date(date.valueOf());
	result.setFullYear(result.getFullYear() + years);
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

exports.nextNotice = function(source,operator,options) {
	var results = [];
	const [iMonth, iDay] = operator.operand.split("-").map(Number);
	if (Number.isInteger(iDay)) source(function(tiddler,title) {
		var value = $tw.utils.parseDate(title);
		if (value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
			if (Number.isNaN(iMonth) || iMonth < 1 || iMonth > 12) {
				var newDate = new Date(value.getFullYear(), value.getMonth(), iDay);
				if (value > newDate) newDate = addMonths(newDate, 1);
				results.push($tw.utils.formatDateString(newDate, "YYYY0MM0DD"));
			} else {
				var newDate = new Date(value.getFullYear(), iMonth - 1, iDay);
				if (value > newDate) newDate = addYears(newDate, 1);
				results.push($tw.utils.formatDateString(newDate, "YYYY0MM0DD"));
			}
		}
	});
	return results;
};

})();
