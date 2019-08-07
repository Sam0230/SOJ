#!/usr/bin/env node

var fs = require("fs"),
	configure = JSON.parse(fs.readFileSync("../database/configure.json").toString()),
	portNumber = +configure.daemonListeningPort,
	messageBus = require("./message_bus.js"),
	Message = messageBus.Message;

childProcess.exec(workerThreads.workerData.diff + " workdir/" + process.pid + "/" + workerThreads.workerData.id + "/input workdir/" + process.pid + "/" + workerThreads.workerData.id + "/output workdir/" + process.pid + "/" + workerThreads.workerData.id + "/answer workdir/" + process.pid + "/" + workerThreads.workerData.id + "/result workdir/" + process.pid + "/" + workerThreads.workerData.id + "/additionalInformation", function () {
	var result = fs.readFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/result").toString();
	if (result.indexOf("ERROR") == 0) {
		throw "Diff error: " + result;
	}
	workerThreads.parentPort.postMessage({
		judgeID: workerThreads.workerData.id,
		score: (+result.substr(2)),
		result: result.substr(0, 2),
		memoryUsage: executerOutput.memoryUsage,
		timeSpent: executerOutput.time,
		additionalInformation: (fs.existsSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/additionalInformation")) ? (fs.readFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/additionalInformation").toString()) : (""),
		ret: executerOutput.ret
	});
	rmdirSyncExt("workdir/" + process.pid + "/" + workerThreads.workerData.id);
});