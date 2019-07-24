#!/usr/bin/env node

var cluster = require("cluster"),
	jayson, spawn = require("child_process").spawn,
	ret = {},
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
		ret = 0;
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
		ret = [];
		for (var i = 0; i < receiving.length && arg.maxReceiverCount; i++) {
			if (!arg.to || (arg.to.id.length == 0 && arg.to.family.length == 0) || (receiving[i].id == undefined && receiving[i].family == undefined) || arg.to.id.indexOf(receiving[i].id) != -1 || arg.to.family.indexOf(receiving[i].family) != -1) {
				ret[ret.length] = {
					id: receiving[i].id,
					family: receiving[i].family
				};
				receiving[i].callback(undefined, arg.content);
				receiving.splice(i, 1);
				arg.maxReceiverCount--;
				i--;
			}
		}
		callback(undefined, ret);
	},
	receive: function (arg, callback) {
		for (var i = 0; i < receiving.length; i++) {
			if (receiving[i].id == arg.id) {
				receiving[i].callback("__MESSAGE__BUS__DETECTED__CONFLICT__ozmflqnoenrksjhb__");
				receiving.splice(i, 1);
				break;
			}
		}
		receiving[receiving.length] = {
			id: arg.id,
			family: arg.family,
			callback: callback,
		}
	}
}).tcp().listen(process.argv[2]);