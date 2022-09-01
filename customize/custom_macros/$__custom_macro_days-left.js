/*\
title: $:/custom/macro/days-left.js
type: application/javascript
tags: $:/tags/Macro customized
module-type: macro

Calculate the days left between today and deadline.

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/
exports.name = "days-left";

exports.params = [
    {name: "deadline"}  //date of the deadline
];

/*
Helper functions
*/
var getDate = function(datestr) { //datestr format: 20180218
    var dateObj;
    if (datestr) {
        dateObj = $tw.utils.parseDate(datestr);
        if($tw.utils.isDate(dateObj) && dateObj.toString() !== "Invalid Date") {
            return dateObj.setHours(0,0,0,0);
        } else {
            return null;
        }
    } else {
        dateObj = new Date();
        return dateObj.setHours(0,0,0,0);
    }
}

var dayDiff = function(first, second) {
    if (first && second) {
        var oneDay = 24*60*60*1000; //hours*minutes*seconds*milliseconds
        return Math.round((second - first) / oneDay);
    } else return -1;
}

/*
Run the macro
*/
exports.run = function(deadline) {
    var diff = dayDiff(getDate(), getDate(deadline));
    if (diff > 5) {
        return diff + " days left";
    } else if (diff > 3) {
	return "@@color:magenta;" + diff + " days left@@";
    } else if (diff == 1) {
	return "@@color:red;" + diff + " day left@@";
    } else if (diff > 0) {
	return "@@color:red;" + diff + " days left@@";
    } else if (diff == 0) {
        return "@@color:red;font-weight:bold;Today@@";
    } else {
        return "@@color:red;font-weight:bold;OVERDUE@@";
    }
};

})();
