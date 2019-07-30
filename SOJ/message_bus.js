/* A message bus to send, receive and listen messages among multi programs.
Usage
First start the message bus daemon.

Send a message from A:
var messageBus = require("./message_bus.js"), Message = messageBus.Message;
var message = new Message("A", {
	id: "B",               // This will send a message to a program with ID "B". (optional)
	family: "FAMILY",      // This will send a message to every program in family "FAMILY". (optional)
	// If both of them is defined, programs match either id or family will receive this message
	// If nither id nor family is defined, all programs will receive this message.
}, 3,                      // This message will be sent to at most 3 programs. Minus value has the same meaning as Infinity
 "This is a message.",     // Content of this message
 function (result) {       // callback function
	console.log(result);   // result contains ID and family of every programs which receives the message.
});
message.send(PORT_NUMBER); // Daemon listening port

Receive a message from B:
var messageBus = require("./message_bus.js"), Message = messageBus.Message;
messageBus.listen("B",     // ID of this program. If A registered an ID first, then B registered the same ID, A will receive { ERROR: "STOPPED" }.
 "FAMILY",                 // Family of this program. Multi programs can share a family.
 // If both is defined, the program will receive messages matches any of them.
 // If nither id nor family is defined, it will receive any message.
 function (message) {      // callback function
	console.log(message);  // a messageBus.Message object
}, 5,                      // The program can receive a message at most 5 time.
 PORT_NUMBER);             // Daemon listening port

Stop B from receiving message:
var messageBus = require("./message_bus.js"), Message = messageBus.Message;
messageBus.stop("B",       // ID of target program. It will receive { ERROR: "STOPPED" }.
 "FAMILY",                 // Family of target programs.
 // If both is defined, programs matches any of them will stopp listening.
 // If nither id nor family is defined, all listening will stop.
 function (result) {       // callback function
	console.log(result);   // result contains ID and family of every programs which stoped listening.
}, PORT_NUMBER);           // Daemon listening port
############################################################################ WARNING ###########################################################################
######## If you set function (message) {} as the callback function directly, you will NOT be able to start a worker thread in the callback function !!! ########
######## Please use process message event to start a new thread !!!                                                                                     ########
*/
var jayson, processID = Math.random().toString().substr(2) + process.pid + Math.random().toString().substr(2),
	intervalID,
	listenerCount = 0;

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

module.exports = {
	Message: function (from, to, maxReceiverCount, content, callback) {
		this.from = from;
		this.to = to;
		this.maxReceiverCount = maxReceiverCount;
		this.content = content;
		this.callback = callback;
		this.send = function (port) {
			var this_callback = this.callback;
			jayson.client.tcp({
				port: port
			}).request("send", {
				from: this.from,
				to: this.to,
				maxReceiverCount: (this.maxReceiverCount != Infinity) ? (this.maxReceiverCount) : (-1),
				content: this
			}, function (err, ret) {
				if (err) {
					throw err;
				}
				if (this_callback) {
					this_callback(ret.result);
				}
			});
		}
	},
	listen: function (id, family, callback, maxCount, port) {
		var regCount = maxCount,
			lastCount = 0,
			answerCount = 0,
			stop = false;
		if (regCount > 750) {
			regCount = 750;
			lastCount = maxCount - 750;
		}
		if (listenerCount++ == 0 && listenerCount == 1) {
			intervalID = setInterval(function () {}, 1000 * 60 * 60 * 24);
		}
		var callback_rpc = function (err, ret) {
			if (stop) {
				return;
			}
			if (err == "__MESSAGE__BUS__STOPPED__ozmflqnoenrksjhb__") {
				stop = true;
				callback({
					ERROR: "STOPPED"
				});
				if (--listenerCount == 0) {
					clearInterval(intervalID);
				}
				return;
			}
			if (err) {
				stop = true;
				if (--listenerCount == 0) {
					clearInterval(intervalID);
				}
				throw err;
			}
			if (!ret) {
				stop = true;
				callback({
					ERROR: "SERVER_EXITED"
				});
				if (--listenerCount == 0) {
					clearInterval(intervalID);
				}
				return;
			}
			if (ret && ret.jsonrpc == "2.0" && ret.id && ret.error && ret.error.code < 0 && ret.error.message == "Internal error") {
				stop = true;
				callback({
					ERROR: "STOPPED"
				});
				if (--listenerCount == 0) {
					clearInterval(intervalID);
				}
				return;
			}
			if (callback) {
				callback(ret.result);
			}
			if (lastCount > 0) {
				jayson.client.tcp({
					port: port
				}).request("listen", {
					id: id,
					processID: processID,
					family: family
				}, callback_rpc);
			}
			lastCount--;
			if (++answerCount == maxCount) {
				clearInterval(intervalID);
			}
		}
		for (var i = 0; i < regCount; i++) {
			jayson.client.tcp({
				port: port
			}).request("listen", {
				id: id,
				processID: processID,
				family: family
			}, callback_rpc);
		}
	},
	stop: function (id, family, callback, port) {
		jayson.client.tcp({
			port: port
		}).request("stop", {
			id: id,
			family: family
		}, function (err, ret) {
			if (err) {
				throw err;
			}
			if (callback) {
				callback(ret.result);
			}
		});
	}
}