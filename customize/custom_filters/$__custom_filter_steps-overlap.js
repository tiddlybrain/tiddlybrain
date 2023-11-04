/*\
title: $:/custom/filter/steps&overlap.js
type: application/javascript
tags: customized
module-type: filteroperator

overlap: 判断给定的时间段和任务的执行时间是否重叠, e.g. [[$:/temp/done]overlap[20200902:20200910]]
percent: 计算任务完成率, e.g. percent[a]
getTDate: 获取开始时间
getDDate: 获取结束时间
getTypeStep: 获取步骤的类型
finishedStepNames: 获取某天完成的 Steps 的名称

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Helper functions
*/
var getName = function(task) {
	var pattern = /^<<(a|w|d|c)\s+["'](.+?)["']\s+/;
	var result = task.match(pattern);
	if(result) {
		return result[2];
	} else {
		return "";
	}
}

var getType = function(task) {
	switch (task.substring(0, task.indexOf(' '))) {
		case "<<a":
			return "Normal";
		case "<<w":
			return "Waiting";
		case "<<d":
			return "Deadline";
		case "<<c":
			return "Cancelled";
		default:
			return null;
	}
}

var getStartTime = function(task) {
	var pattern = /t:["']?(\d{8})["']?/;
	var result = task.match(pattern);
	if(result) {
		return result[1];
	} else {
		return null;
	}
}

var getEndTime = function(task) {
	var pattern = /d:["']?(\d{8})["']?/;
	var result = task.match(pattern);
	if(result) {
		return result[1];
	} else {
		return null;
	}
}

var getDelegate = function(task) {
	var pattern = /\sto:["'](.*?)["']/;
	var result = task.match(pattern);
	if(result) {
		return result[1];
	} else {
		return "";
	}
}

var dateFormat = function(date) {
	date = date || "";
	return date.substring(0,4) + "-" + date.substring(4,6) + "-" + date.substring(6,8);
}

var durationCheck = function(S, E, duration) {
	var isOverlap = true, td = duration.split(":"), t = td[0], d = td[1];
	if (S && d < S) isOverlap = false;
	if (E && t > E) isOverlap = false;
	return isOverlap;
}

/*
Export our filter function
*/
exports.overlap = function(source,operator,options) {
	var results = [], duration = "", pattern = /\d{8}:\d{8}/;
	if (operator.operand && pattern.test(operator.operand)) {
		duration = operator.operand;
		source(function(tiddler,title) {
			if (operator.suffix === "date") {
				var S = title, E = title;
				if (durationCheck(S, E, duration)) results.push(title);
			} else if (tiddler) {
				var S = tiddler.getFieldString("date");
				var E = tiddler.getFieldString("finish");
				if (durationCheck(S, E, duration)) results.push(title);
			}
		});
	}
	return results;
};

exports.percent = function(source,operator,options) {
	var results = [], pattern;
	switch (operator.operand) {
		case "a":
			pattern = '<<a\\s.+?>>';
			break;
		case "d":
			pattern = '<<d\\s.+?>>';
			break;
		case "w":
			pattern = '<<w\\s.+?>>';
			break;
		default:
			pattern = '<<[adw]\\s.+?>>';
	}
	var regexp = new RegExp(pattern, 'g');
	source(function(tiddler,title) {
		if (tiddler) {
			var content = tiddler.getFieldString("text");
			var matches = content.match(regexp) || [];
			var total = 0, totalDone = 0;
			matches.forEach(function(match) {
				total += 1;
				var start_time = getStartTime(match);
				var end_time = getEndTime(match);
				if (start_time && end_time) totalDone += 1;
			})
			var percentage = total === 0 ? "N/A" : Math.round(totalDone / total * 100) + "%";
			results.push(percentage);
		}
	});
	return results;
};

exports.getTDate = function(source,operator,options) {
	var results = [], pattern_step = /<<(a|w|d|c)\s.+?>>/g;
	if (operator.operand) {
		source(function(tiddler,title) {
			if (tiddler) {
				var content = tiddler.getFieldString("text");
				var steps = content.match(pattern_step) || [];
				steps.every(step => {
					if (step.indexOf(operator.operand) !== -1) {
						var t = getStartTime(step);
						if (t) results.push(t);
						return false;
					} else {
						return true;
					}
				});
			}
		});
	}
	return results;
};

exports.getDDate = function(source,operator,options) {
	var results = [], pattern_step = /<<(a|w|d|c)\s.+?>>/g;
	if (operator.operand) {
		source(function(tiddler,title) {
			if (tiddler) {
				var content = tiddler.getFieldString("text");
				var steps = content.match(pattern_step) || [];
				steps.every(step => {
					if (step.indexOf(operator.operand) !== -1) {
						var d = getEndTime(step);
						if (d) results.push(d);
						return false;
					} else {
						return true;
					}
				});
			}
		});
	}
	return results;
};

exports.getTypeStep = function(source,operator,options) {
	var results = [], pattern_step = /<<(a|w|d|c)\s.+?>>/g;
	if (operator.operand) {
		source(function(tiddler,title) {
			if (tiddler) {
				var content = tiddler.getFieldString("text");
				var steps = content.match(pattern_step) || [];
				steps.every(step => {
					if (step.indexOf(operator.operand) !== -1) {
						var t = getType(step);
						if (t) results.push(t);
						return false;
					} else {
						return true;
					}
				});
			}
		});
	}
	return results;
};

exports.finishedStepNames = function(source,operator,options) {
	var results = [], pattern_step = /<<(a|d)\s.+?>>/g;
	if (operator.operand) {
		source(function(tiddler,title) {
			if (tiddler) {
				var content = tiddler.getFieldString("text");
				var steps = content.match(pattern_step) || [];
				steps.forEach(step => {
					var d = getEndTime(step);
					if (d && d === operator.operand) results.push(getName(step));
				});
			}
		});
	}
	return results;
};

})();
