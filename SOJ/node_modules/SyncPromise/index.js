var CPPModule, EventEmitter = require('events');
try {
	CPPModule = require("./build/Release/CPPModule.node");
} catch (err) {
	if (err.code) {
		var install_finish;
		console.log("Please run SyncPromise/build.sh to build C++ module first.");
		process.exit();
	}
}

module.exports.msleep = msleep = function msleep(milliseconds) {
	var reachedTimeout = Buffer.from("0");
	if (milliseconds != Infinity) {
		setTimeout(function () {
			reachedTimeout.write("1");
		}, milliseconds);
	} else {
		setTimeout(function () {}, 2100000000);
	}
	CPPModule(Buffer.from("0"), reachedTimeout, Buffer.from("1"), process._tickCallback);
}

module.exports.sleep = sleep = function sleep(seconds) {
	msleep(seconds * 1000);
}

module.exports.originalPromise = Promise;

module.exports.extraPromise = function Promise(executor) {
	var ret = {},
		pending = Buffer.from("1"),
		attachable = true,
		DetachEmitter = new EventEmitter,
		status, result;
	(ret = new module.exports.originalPromise(function (resolve, reject) {
		executor(function (value) {
				if (+(pending.toString())) {
					ret.status = "resolved";
					status = "resolved";
					ret.result = value;
					result = value;
					resolve(value);
					pending.write("0");
				}
			},
			function (reason) {
				if (+(pending.toString())) {
					pending.write("0");
					ret.status = "rejected";
					status = "rejected";
					ret.result = reason;
					result = reason;
					reject(reason);
				}
			},
			function (value) {
				attachable = value;
			},
			function () {
				if (+(pending.toString())) {
					DetachEmitter.emit("detach");
				}
			});
	}));
	if (+(pending.toString())) {
		ret.status = "pending";
		ret.result = undefined;
	} else {
		ret.status = status;
		ret.result = result;
	}
	ret.attach = function attach(timeout) {
		if (!attachable) {
			return -1;
		}
		if (ret.status != "pending") {
			return -2;
		}
		process._tickCallback();
		var timeoutID, reachedTimeout = Buffer.from("0"),
			detachRequired = Buffer.from("0");
		if (timeout != undefined && timeout != Infinity) {
			timeoutID = setTimeout(function () {
				reachedTimeout.write("1");
			}, timeout);
		}
		var requireDetach = function requireDetach() {
			detachRequired.write("1");
		}
		DetachEmitter.prependListener("detach", requireDetach);
		CPPModule(detachRequired, reachedTimeout, pending, process._tickCallback);
		if (Boolean(+reachedTimeout.toString())) {
			DetachEmitter.removeListener('detach', requireDetach);
			return -3;
		}
		if (timeoutID) {
			clearTimeout(timeoutID);
		}
		if (Boolean(+detachRequired.toString())) {
			DetachEmitter.removeListener('detach', requireDetach);
			return -4;
		}
		DetachEmitter.removeListener('detach', requireDetach);
		return 0;
	};
	return ret;
}

module.exports.applyGlobalExtraPromise = function applyGlobalExtraPromise(executor) {
	Promise = module.exports.extraPromise;
}

module.exports.restoreOriginalPromise = function restoreOriginalPromise(executor) {
	Promise = module.exports.originalPromise;
}