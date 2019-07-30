#!/usr/bin/env node

var cluster = require("cluster"),
	jayson, spawn = require("child_process").spawn,
	receiving = [];

try {
	jayson = require("jayson");
} catch (err) {
	if (err.code == "MODULE_NOT_FOUND") {
		var install_finish;
		console.log("Installing package Jayson. Please restart this program a few seconds later.");
		spawn("npm", ["install", "jayson"]);
		process.exit();
	}
}

if (isNaN(+process.argv[2]) || (+process.argv[2]) == Infinity) {
	console.log("Usage: ");
	console.log("message_bus_daemon.js <port>");
	process.exit();
}

jayson.server({
	send: function (arg, callback) {
		if (arg.to) {
			if (!arg.to.id) {
				arg.to.id = [];
			}
			if (arg.to.id.constructor != Array) {
				arg.to.id = [arg.to.id];
			}
			arg.to.id = [...new Set(arg.to.id)]; // Remove duplication
			if (!arg.to.family) {
				arg.to.family = [];
			}
			if (arg.to.family.constructor != Array) {
				arg.to.family = [arg.to.family];
			}
			arg.to.family = [...new Set(arg.to.family)];
		}
		var result = [],
			sent = [];
		for (var i = 0; i < receiving.length && arg.maxReceiverCount; i++) {
			if (!sent[receiving[i].id] && (!arg.to || (arg.to.id.length == 0 && arg.to.family.length == 0) || (receiving[i].id == undefined && receiving[i].family == undefined) || arg.to.id.indexOf(receiving[i].id) != -1 || arg.to.family.indexOf(receiving[i].family) != -1)) {
				sent[receiving[i].id] = true;
				result[result.length] = {
					id: receiving[i].id,
					family: receiving[i].family
				};
				receiving[i].callback(undefined, arg.content);
				arg.maxReceiverCount--;
				receiving.splice(i, 1);
				i--;
			}
		}
		callback(undefined, result);
	},
	listen: function (arg, callback) {
		for (var i = 0; i < receiving.length; i++) {
			if (receiving[i].id == arg.id && receiving[i].listenID != arg.listenID) {
				receiving[i].callback("__MESSAGE__BUS__STOPPED__ozmflqnoenrksjhb__", undefined);
				receiving.splice(i, 1);
			}
			if (receiving[i].id == arg.id) {
				a++;
			}
		}
		receiving[receiving.length] = {
			id: arg.id,
			listenID: arg.listenID,
			family: arg.family,
			callback: callback
		}
	},
	stop: function (arg, callback) {
		var result = [];
		for (var i = 0; i < receiving.length; i++) {
			if (!(arg.id || arg.family) || receiving[i].id == arg.id || receiving[i].family == arg.family) {
				result[result.length] = {
					id: receiving[i].id,
					family: receiving[i].family
				};
				receiving[i].callback("__MESSAGE__BUS__STOPPED__ozmflqnoenrksjhb__", undefined);
				receiving.splice(i, 1);
				i--;
			}
		}
		callback(undefined, result);
	}
}).tcp().listen(process.argv[2]);