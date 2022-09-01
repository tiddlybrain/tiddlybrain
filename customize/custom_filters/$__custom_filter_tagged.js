/*\
title: $:/custom/filter/tagged.js
type: application/javascript
tags: customized
module-type: filteroperator

Filter input tiddlers in which all tags specified in the operand are tagged.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.tagged = function(source,operator,options) {
    var results = [],
        tagsArray = $tw.utils.parseStringArray(operator.operand);

    source(function(tiddler,title) {
        if(tiddler && tiddler.fields.tags && tagsArray.every(function(tag) {
            return tiddler.fields.tags.indexOf(tag) != -1;
        })) {
            results.push(title);
        };
    });

    return results;
};

})();
