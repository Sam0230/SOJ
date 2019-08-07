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
	type: function (path) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "type",
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
	},
	copy: function (src, dst, dirModeOnMerge) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "copy",
				src: src,
				dst: dst,
				dirModeOnMerge: dirModeOnMerge
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
	move: function (src, dst) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "move",
				src: src,
				dst: dst
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
	chmod: function (path, fileMode, dirMode) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "chmod",
				path: path,
				fileMode: fileMode,
				dirMode: dirMode
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
	readlink: function (path) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "readlink",
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
	mklink: function (path, link) {
		var id = "DATABASE_CLIENT_" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '');
		var p = new Promise(function (resolve, reject, attachable, detach) {
			messageBus.listen(id, undefined, function (result) {
				resolve(result);
			}, 1, portNumber);
		});
		var message = new Message(id, {
				id: "database",
			}, 1, {
				request: "mklink",
				path: path,
				link: link,
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