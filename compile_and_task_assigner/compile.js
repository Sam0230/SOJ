#!/usr/bin/env node

var fs = require("fs"),
	configure = JSON.parse(fs.readFileSync("../database/configure.json").toString()),
	portNumber = +configure.daemonListeningPort,
	messageBus = require("./message_bus.js"),
	Message = messageBus.Message;

messageBus.listen("judgeTasksAssigner", undefined, function (message) {
	console.log(message)
}, Infinity, portNumber);