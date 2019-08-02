#!/usr/bin/env node

var messageBus = require("./message_bus.js"),
	Message = messageBus.Message,
	fs = require("fs"),
	configure = JSON.parse(fs.readFileSync("configure.json").toString()),
	portNumber = +fs.readFileSync("port").toString();
messageBus.listen("database", undefined, function (message) {
	switch (message.content.request) {
	case "remove":
		break;
	case "mkdir":
		break;
	case "isfile":
		break;
	case "exist":
		break;
	case "query":
		break;
	case "copy":
		break;
	case "move":
		break;
	case "read":
		var result;
		try {
			result = fs.readFileSync(message.content.path).toString();
		} catch (exception) {
			var replyMessage = new Message("database", {
				id: message.from,
			}, 1, {
				status: "err",
				result: exception.message
			}, function () {});
			replyMessage.send(portNumber);
			return;
		}
		var replyMessage = new Message("database", {
			id: message.from,
		}, 1, {
			status: "ok",
			result: result
		}, function () {});
		replyMessage.send(portNumber);
		break;
	case "write":
		break;
	}
}, Infinity, portNumber);