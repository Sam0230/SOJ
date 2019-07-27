/* 使用方法
发送消息:
var messageBus = require("./message_bus.js");
var message = new messageBus.Message("A", {
	id: "B",              // 给ID为B的程序发送一条消息。（可选）
	family: "FAMILY",     // 给家族为"FAMILY"的每个程序各发送一条消息。（可选）
	// 如果同时定义了id和family，符合任意一个的程序都将收到这条消息。
	// 如果都没定义，所有程序都将收到消息。
}, 3,                     // 最多给三个程序发送消息。负数值和Infinity等价。
 "This is a message.",    // 消息内容
 function (result) {      // 回调函数
	console.log(result);  // result 包含每个收到消息的程序的ID和family。
});
message.send(端口号);

接受消息:
var messageBus = require('./message_bus.js');
messageBus.receive("B",   // 这个程序的ID。如果A先注册了某个ID，然后B注册了相同的ID，A将收到{ MSGBUS_ERROR: "ID_CONFLICT" }。
 "FAMILY"                 // 这个程序的家族。多个程序可以共享一个家族。
 // 如果同时定义了这两个，程序将收到符合任意一个条件的消息。
 // 如果两个都没定义，程序将收到所有消息。
, function (message) {    // 回调函数
	console.log(message); // 一个 messageBus.Message对象
}, 端口号);
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
			id: id,
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