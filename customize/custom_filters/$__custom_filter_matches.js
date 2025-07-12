/*\
title: $:/custom/filter/matches.js
type: application/javascript
tags: customized
module-type: filteroperator

Return all regex pattern matches of a given string

\*/
"use strict";

/*
Export our filter function
*/
exports.matches = function(source,operator,options) {
    var results = [], re,
        suffixes = (operator.suffixes || [])[0] || [],
        regexp = operator.operand || "";

    if(suffixes.indexOf("caseinsensitive") !== -1) {
        re = new RegExp(regexp, "ig");
    } else {
        re = new RegExp(regexp, "g");
    }

    source(function(tiddler,title) {
        var matchArray = (title || '').match(re) || [];
        matchArray.every(ele => results.push(ele));
    });

    return results;
};
