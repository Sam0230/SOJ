#!/usr/bin/node

var messageBus = require("./message_bus.js"),
	Message = messageBus.Message,
	fs = require("fs"),
	configure = JSON.parse(fs.readFileSync("../database/configure.json").toString()),
	maxWorkerCount = +configure.maxWorkerCount,
	portNumber = +configure.daemonListeningPort;
var message = new Message("Web", {
	id: "judgeTasksAssigner",
}, 1, {
	submitID: "qwe",
	language: "cpp",
	code: "#include <iostream>\nusing namespace std;\nint main() {\n	int a, b;\n	cin >> a >> b;\n	cout << a + b << endl;\n	return 0;\n}"
}, function (result) {
	console.log(result);
});
message.send(portNumber);