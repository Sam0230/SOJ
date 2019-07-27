#!/usr/bin/node

var messageBus = require("./message_bus.js"),
	Message = messageBus.Message,
	fs = require("fs"),
	configure = JSON.parse(fs.readFileSync("../database/configure.json").toString()),
	maxWorkerCount = +configure.maxWorkerCount,
	portNumber = +configure.daemonListeningPort;
var message = new Message("judgeTasksAssign", {
	family: "judger",
}, 1, {
	judgeID: "123",
	input: "10 20",
	answer: "30",
	memory: 8192,
	time: 500,
	filename: "123454321",
	diff: "../judger/standard_judge"
}, function (result) {
	console.log(result);
});
message.send(portNumber);