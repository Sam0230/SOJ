#!/usr/bin/env node

var easySync = require("./EasySync"),
	a = 1,
	b = 2;

var result = easySync(function (solve) {
	console.log("Solving. . . ");
	setTimeout(function () {
		console.log("Solved!");
		solve(a + b);
	}, 2000);
});
console.log("Result:", result, "\nThis message will display after solved.");