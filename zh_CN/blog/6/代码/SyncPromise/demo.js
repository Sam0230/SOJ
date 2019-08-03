#!/usr/bin/env node

var SyncPromise = require("./SyncPromise"), // Behaviour of SyncPromise is same as original Promise, but it contains an attach function.
	a = 1,
	b = 2;

SyncPromise.applyGlobalExtraPromise(); // Integrate SyncPromise.extraPromise into Promise. You can use SyncPromise.originalPromise to access the original Promise.

setTimeout(function () {
	console.log("This message will be displayed before waking up."); // The event loop will keep running while sleeping.
}, 250);

msleep(500); // Sleep for 500ms.
console.log("I woke up.");

var p = new Promise(function (resolve, reject, attachable, detach) {
	setTimeout(function () {
		detach();
	}, 100); // Detach the first p.attach();
	setTimeout(function () {
		new Promise(function (resolve, reject, attachable, detach) {
			setTimeout(function () {
				a++;
				resolve();
			}, 500);
		}).attach(); // Wait until one of resolve, reject, detach is called.
		resolve({
			a: a,
			b: b,
			sum: a + b
		});
	}, 1000);
});
p.attach();
console.log("It was detached!");
p.attach(500);
console.log("Timeout was reached!"); // Now it's 400ms to solve, but the timeout (500ms) was reached, the program will stop waiting.
p.attach();
console.log(p); // p.status is expected to be "resolved". p.result is expected to be { a: 2, b: 2, sum:4 }.

p = new Promise(function (resolve, reject, attachable, detach) {
	setTimeout(function () {
		attachable(false);
		detach();
	}, 100);
	a++;
	setTimeout(function () {
		resolve(a + b);
	}, 1000);
});
p.then(function (value) {
	console.log("Finished. The result is", value + ".");
});

p.attach(); // Return after 100 ms.
console.log("It was detached!");
p.attach(); // Return immediately.
console.log("Not attachable!");
p.attach(); // Also return immediately.
p.attach();
p.attach();
p.attach();
p.attach();
p.attach();
p.attach();