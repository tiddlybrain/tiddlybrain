/*\
title: $:/custom/macro/days-passed.js
type: application/javascript
tags: $:/tags/Macro customized
module-type: macro

Calculate the number of days passed since the start date.

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/
exports.name = "days-passed";

exports.params = [
    {name: "start"},  //start date
    {name: "end"}   //end date
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
exports.run = function(start, end) {
    var diff = dayDiff(getDate(start), getDate(end)) + 1;
    if (diff < 1) {
	return `@@font-weight:bold;on ${start.substring(0,4)}-${start.substring(4,6)}-${start.substring(6,8)}@@`;
    } else if (diff == 1) {
        return "Today";
    } else if (diff < 4) {
        return diff + " days";
    } else if (diff < 8) {
        return "@@color:#ff6c00;" + diff + " days@@";
    } else {
	return "@@color:red;" + diff + " days@@";
    }
};

})();
