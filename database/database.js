#!/usr/bin/env node



var messageBus = require("./message_bus.js"),
	Message = messageBus.Message,
	fs = require("fs"),
	configure = JSON.parse(fs.readFileSync("configure.json").toString()),
	portNumber = +fs.readFileSync("port").toString();
messageBus.listen("database", undefined, function (message) {
	switch (message.request) {
	case "remove":
		{
			break;
		}
	case "mkdir":
		{
			break;
		}
	case "isfile":
		{
			break;
		}
	case "exist":
		{
			break;
		}
	case "query":
		{
			break;
		}
	case "copy":
		{
			break;
		}
	case "move":
		{
			break;
		}
	case "read":
		{
			break;
		}
	case "write":
		{
			break;
		}
	}
}, Infinity, portNumber);