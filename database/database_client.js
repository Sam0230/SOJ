#!/usr/bin/env node

var messageBus = require("./message_bus.js"),
	Message = messageBus.Message,
	fs = require("fs"),
	portNumber = +fs.readFileSync("port").toString();

require("SyncPromise").applyGlobalExtraPromise();

module.exports = {
	read: function (path) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "read",
				path: path
			},
			function (received) {
				if (received.length != 1) {
					throw "Database: Cannot connect with daemon!";
				}
			});
		message.send(portNumber);
		p.attach();
		return p.result.content;
	},
	write: function (path, content, mode, encoding) {
		if (mode == undefined) {
			mode = 0o644;
		}
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "write",
				path: path,
				content: content,
				mode: mode,
				encoding: encoding
			},
			function (received) {
				if (received.length != 1) {
					throw "Database: Cannot connect with daemon!";
				}
			});
		message.send(portNumber);
		p.attach();
		return p.result.content;
	},
	remove: function (path) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "remove",
				path: path
			},
			function (received) {
				if (received.length != 1) {
					throw "Database: Cannot connect with daemon!";
				}
			});
		message.send(portNumber);
		p.attach();
		return p.result.content;
	},
	mkdir: function (path, mode) {
		if (mode == undefined) {
			mode = 0o755;
		}
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "mkdir",
				path: path,
				mode: mode
			},
			function (received) {
				if (received.length != 1) {
					throw "Database: Cannot connect with daemon!";
				}
			});
		message.send(portNumber);
		p.attach();
		return p.result.content;
	},
	exists: function (path) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "exists",
				path: path
			},
			function (received) {
				if (received.length != 1) {
					throw "Database: Cannot connect with daemon!";
				}
			});
		message.send(portNumber);
		p.attach();
		return p.result.content;
	},
	isfile: function (path) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "isfile",
				path: path
			},
			function (received) {
				if (received.length != 1) {
					throw "Database: Cannot connect with daemon!";
				}
			});
		message.send(portNumber);
		p.attach();
		return p.result.content;
	},
	query: function (path) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "query",
				path: path
			},
			function (received) {
				if (received.length != 1) {
					throw "Database: Cannot connect with daemon!";
				}
			});
		message.send(portNumber);
		p.attach();
		return p.result.content;
	}
}

console.log(module.exports.query("a"));