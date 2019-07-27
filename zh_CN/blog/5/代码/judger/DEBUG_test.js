#!/usr/bin/node

var messageBus = require("./message_bus.js"),
	Message = messageBus.Message,
	fs = require("fs");
var message = new Message("judgeTasksAssign", {
	family: "judger",
}, 1, {
	input: "10 20",
	answer: "30",
	memory: 8192,
	time: 500,
	filename: "123454321",
	diff: "../judger/standard_judge"
}, function (result) {
	console.log(result);
});
message.send(+fs.readFileSync("../database/configure/daemon_listening_port").toString());