#!/usr/bin/env node

var messageBus = require("./message_bus.js"),
	Message = messageBus.Message,
	fs = require("fs"),
	configure = JSON.parse(fs.readFileSync("configure.json").toString()),
	portNumber = +fs.readFileSync("port").toString();

var rmdirSyncExt = function rmdirSyncExt(path) { // Don't use recursive removing, or it will throw an "ENAMETOOLONG: name too long" error when the directory tree is too deep.
	var finished;
	while (!finished) {
		finished = true;
		fs.readdirSync(path).forEach(function (file) {
			var currentPath = path + "/" + file;
			if (fs.lstatSync(currentPath).isDirectory()) {
				finished = false;
				fs.readdirSync(currentPath).forEach(function (file2) {
					fs.renameSync(currentPath + "/" + file2, path + "/.___REMOVING___" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, '') + "___" + Math.random().toString().substr(2).replace(/^0/g, '').replace(/e\-.*$/g, ''));
				});
				fs.rmdirSync(currentPath);
			} else {
				fs.unlinkSync(currentPath);
			}
		});
	}
	fs.rmdirSync(path);
};

var cpdirSync = function cpdirSync(src, dst, dirModeOnMerge) {
	if (dirModeOnMerge == undefined) {
		dirModeOnMerge = "overlap";
	}
	if (!fs.existsSync(dst)) {
		var oldumask = process.umask(0o000);
		fs.mkdirSync(dst, {
			mode: fs.lstatSync(src).mode,
			recursive: true
		});
		process.umask(oldumask);
	} else {
		if (fs.lstatSync(dst).isFile()) {
			fs.unlinkSync(dst);
			var oldumask = process.umask(0o000);
			fs.mkdirSync(dst, {
				mode: fs.lstatSync(src).mode,
				recursive: true
			});
			process.umask(oldumask);
		} else {
			if (dirModeOnMerge == "override") {
				fs.chmodSync(dst, fs.lstatSync(src).mode);
			}
			if (dirModeOnMerge == "mix") {
				fs.chmodSync(dst, fs.lstatSync(src).mode | fs.lstatSync(dst).mode);
			}
			if (dirModeOnMerge == "overlap") {
				fs.chmodSync(dst, fs.lstatSync(src).mode & fs.lstatSync(dst).mode);
			}
		}
	}
	var currentSrc, currentDst;
	fs.readdirSync(src).forEach(function (file, index) {
		currentSrc = src + "/" + file;
		currentDst = dst + "/" + file;
		if (fs.lstatSync(currentSrc).isDirectory()) {
			cpdirSync(currentSrc, currentDst, dirModeOnMerge);
		} else {
			fs.copyFileSync(currentSrc, currentDst);
		}
	});
};

var chmodSyncRec = function chmodSyncRec(path, mode) {
	fs.chmodSync(path, mode);
	fs.readdirSync(path).forEach(function (file, index) {
		var currentPath = path + "/" + file;
		if (fs.lstatSync(currentPath).isDirectory()) {
			chmodSyncRec(currentPath);
		} else {
			fs.chmodSync(currentPath, mode);
		}
	});
};

messageBus.listen("database", undefined, function (message) {
	if (message.ERROR) {
		throw message.ERROR;
	}
	switch (message.content.request) {
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
		try {
			var oldumask = process.umask(0o000); // Since the mode will be set to (message.content.mode & (~process.umask())) and the umask is 0o022 by default, we need to change it to 0o000 to allow mode 0o777.
			fs.writeFileSync(message.content.path, message.content.content, {
				encoding: message.content.encoding,
				mode: message.content.mode
			});
			process.umask(oldumask); // Restore the orininal umask.
			// The same below in mkdir.
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
			status: "ok"
		}, function () {});
		replyMessage.send(portNumber);
		break;
	case "remove":
		var result;
		try {
			fs.unlinkSync(message.content.path);
		} catch (exception) {
			if (exception.code == "EISDIR") {
				try {
					rmdirSyncExt(message.content.path);
				} catch (exception) {
					var replyMessage = new Message("database", {
						id: message.from,
					}, 1, {
						type: "dir",
						status: "err",
						result: exception.message
					}, function () {});
					replyMessage.send(portNumber);
					return;
				}
				var replyMessage = new Message("database", {
					id: message.from,
				}, 1, {
					type: "dir",
					status: "ok"
				}, function () {});
				replyMessage.send(portNumber);
				return;
			}
			var replyMessage = new Message("database", {
				id: message.from,
			}, 1, {
				type: "file",
				status: "err",
				result: exception.message
			}, function () {});
			replyMessage.send(portNumber);
			return;
		}
		var replyMessage = new Message("database", {
			id: message.from,
		}, 1, {
			type: "file",
			status: "ok"
		}, function () {});
		replyMessage.send(portNumber);
		break;
	case "mkdir":
		try {
			var oldumask = process.umask(0o000);
			fs.mkdirSync(message.content.path, {
				mode: message.content.mode,
				recursive: true
			});
			process.umask(oldumask);
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
			status: "ok"
		}, function () {});
		replyMessage.send(portNumber);
		break;
	case "exists":
		var accessable = true;
		try {
			accessable = fs.accessSync(message.content.path, fs.constants.R_OK)
		} catch (exception) {
			if (exception.code == "EACCES") {
				accessable = false;
			}
		}
		if (!accessable) {
			var replyMessage = new Message("database", {
				id: message.from,
			}, 1, {
				status: "err",
				result: "EACCES: permission denied, access '" + message.content.path + "'"
			}, function () {});
			replyMessage.send(portNumber);
			return;
		}
		var result = fs.existsSync(message.content.path);
		var replyMessage = new Message("database", {
			id: message.from,
		}, 1, {
			status: "ok",
			result: result
		}, function () {});
		replyMessage.send(portNumber);
		break;
	case "type":
		var result = {};
		try {
			var stat = fs.lstatSync(message.content.path);
			if (stat.isSymbolicLink()) {
				result.type = "symbolicLink";
				try {
					stat = fs.statSync(message.content.path);
				} catch (exception) {
					if (exception.code == "ENOENT") {
						result.type = "brokenSymbolicLink";
					} else {
						if (exception.code == "ELOOP") {
							result.type = "loopSymbolicLink";
						} else {
							throw exception;
						}
					}
				}
				if (result.type == "symbolicLink") {
					result.dstType = stat.isFile() ? "file" : "directory";
				}
			} else {
				result.type = stat.isFile() ? "file" : "directory";
			}
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
	case "query":
		var result = [];
		try {
			fs.readdirSync(message.content.path).forEach(function (file) {
				result.push(file);
			});
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
	case "copy":
		try {
			if (fs.lstatSync(message.content.src).isDirectory()) {
				cpdirSync(message.content.src, message.content.dst, message.content.dirModeOnMerge);
			} else {
				if (fs.lstatSync(message.content.src).isSymbolicLink()) {
					fs.linkSync(fs.readlinkSync(src), dst);
				} else {
					fs.copyFileSync(message.content.src, message.content.dst);
				}
			}
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
			status: "ok"
		}, function () {});
		replyMessage.send(portNumber);
		break;
	case "move":
		try {
			fs.renameSync(message.content.src, message.content.dst);
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
			status: "ok"
		}, function () {});
		replyMessage.send(portNumber);
		break;
	case "chmod":
		try {
			if (fs.statSync(message.content.path).isDirectory()) {
				chmodSyncRec(message.content.path, message.content.mode);
			} else {
				fs.chmodSync(message.content.path, message.content.mode);
			}
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
			status: "ok"
		}, function () {});
		replyMessage.send(portNumber);
		break;
	case "readlink":
		var result;
		try {
			result = fs.readlinkSync(src);
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
	case "mklink":
		try {
			fs.linkSync(message.content.path, message.content.link);
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
			status: "ok"
		}, function () {});
		replyMessage.send(portNumber);
		break;
	}
}, Infinity, portNumber);