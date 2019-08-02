#!/usr/bin/env node

var SyncPromise = require("./SyncPromise"),
	a = 1,
	b = 2;

msleep(500);

SyncPromise.applyGlobalExtrePromise();

setTimeout(function () {
	console.log("This message will display before solved.");
}, 250);

var p = new Promise(function (resolve, reject, attachable, detach) {
	setTimeout(function () {
		detach();
	}, 100);
	setTimeout(function () {
		new Promise(function (resolve, reject, attachable, detach) {
			setTimeout(function () {
				a++;
				resolve();
			}, 200);
		}).attach(1000);
		new Promise(function (resolve, reject, attachable, detach) {
			setTimeout(function () {
				b++;
				resolve();
			}, 500);
		}).attach(100);
		resolve({
			a: a,
			b: b
		});
	}, 500);
});
p.attach(5000);
console.log(p);
p.then(function (value) {
	console.log(p);
});