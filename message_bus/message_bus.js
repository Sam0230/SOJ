/* Usage
Send a message:
var messageBus = require("./message_bus.js");
var message = new messageBus.Message("A", {
	id: "B",              // This will send a message to a program with ID "B". (optional)
	family: "FAMILY",     // This will send a message to every program in family "FAMILY". (optional)
	// If both of them is defined, programs match either id or family will receive this message
	// If nither id nor family is defined, all programs will receive this message.
}, 3,                     // This message will be sent to at most 3 programs. Minus value has the same meaning as Infinity
 "This is a message.",    // Content of this message
 function (result) {      // callback function
	console.log(result);  // result contains ID and family of every programs which receives the message.
});
message.send(PORT_NUMBER);

Receive a message:
var messageBus = require('./message_bus.js');
messageBus.receive("B",   // ID of this program. If A registered an ID first, then B registered the same ID, A will receive { MSGBUS_ERROR: "SERVER_EXITED" }.
 "FAMILY"                 // Family of this program. Programs can share a family.
 // If both is defined, the program will receive messages matches any of them.
 // If nither id nor family is defined, it will receive any message.
, function (message) {    // callback function
	console.log(message); // a messageBus.Message object
}, PORT_NUMBER);
*/

var jayson;

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
	receive: function (id, family, callback, port) {
		jayson.client.tcp({
			port: port
		}).request("receive", {
			id: process.argv[2],
			family: family
		}, function (err, ret) {
			if (err == "__MESSAGE__BUS__DETECTED__CONFLICT__ozmflqnoenrksjhb__") {
				callback({
					MSGBUS_ERROR: "ID_CONFLICT"
				});
				return;
			}
			if (err) {
				throw err;
			}
			if (!ret) {
				callback({
					MSGBUS_ERROR: "SERVER_EXITED"
				});
				return;
			}
			if (ret && ret.jsonrpc == "2.0" && ret.id && ret.error && ret.error.code < 0 && ret.error.message == "Internal error") {
				callback({
					MSGBUS_ERROR: "ID_CONFLICT"
				});
				return;
			}
			if (callback) {
				callback(ret.result);
			}
		});
	}
}