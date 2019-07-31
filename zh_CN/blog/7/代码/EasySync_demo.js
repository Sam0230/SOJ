#!/usr/bin/env node

var easySync = require("./EasySync");

easySync(function (solve) {
	console.log("Solving. . . ");
	setTimeout(function () {
		console.log("Solved!");
		solve();
	}, 2000);
});
console.log("This message will display after solved.");