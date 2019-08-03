#!/usr/bin/env node

var workerThreads = require("worker_threads"),
	childProcess = require("child_process"),
	fs = require("fs"),
	events = require("events"),
	eventemitr = new events.EventEmitter(),
	stop = false,
	workerCount = 0,
	messages = [],
	workers = [],
	configure = JSON.parse(fs.readFileSync("../database/configure.json").toString()),
	maxWorkerCount = +configure.maxJudgerCount,
	portNumber = +configure.daemonListeningPort;

var rmdirSyncRec = function rmdirSyncRec(path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function (file, index) {
			var currentPath = path + "/" + file;
			if (fs.lstatSync(currentPath).isDirectory()) {
				rmdirSyncRec(currentPath);
			} else {
				fs.unlinkSync(currentPath);
			}
		});
		fs.rmdirSync(path);
	} else {
		throw path + " doesn't exist.";
	}
};

if (workerThreads.isMainThread) {
	if (fs.existsSync("workdir/" + process.pid)) {
		rmdirSyncRec("workdir/" + process.pid);
	}
	fs.mkdirSync("workdir/" + process.pid);
	process.on("exit", function () {
		for (i in workers) {
			workers[i].terminate();
		};
		rmdirSyncRec("workdir/" + process.pid);
	});
	process.on("uncaughtException", function (error) {
		console.log("Judger: Uncaught exception:", error);
		stop = true;
		for (i in workers) {
			workers[i].terminate();
		};
		messageBus.stop("judger" + process.pid, undefined, function () {
			process.exit();
		}, portNumber);
	});
	process.on("SIGINT", function () {
		stop = true;
		for (i in workers) {
			workers[i].terminate();
		};
		messageBus.stop("judger" + process.pid, undefined, function () {
			process.exit();
		}, portNumber);
	});
	process.on("SIGHUP", function () {
		stop = true;
		for (i in workers) {
			workers[i].terminate();
		};
		messageBus.stop("judger" + process.pid, undefined, function () {
			process.exit();
		}, portNumber);
	});
	eventemitr.setMaxListeners(1000);
	var messageBus = require("./message_bus.js"),
		Message = messageBus.Message;

	function start(message) { // I found that if we set function (message) {} as the callback function directly, the worker thread won't start. So, we need to use the message
		if (stop) {
			return;
		}
		if (message.ERROR) {
			throw message.ERROR;
		}
		messages[workerCount] = message;
		eventemitr.emit("judger_start");
	}
	eventemitr.on("judger_start", function (message) {
		var workerID = workerCount++;
		workers[workerID] = new workerThreads.Worker(__filename, {
			workerData: {
				id: workerID,
				judgeID: messages[workerID].content.judgeID,
				input: messages[workerID].content.input,
				answer: messages[workerID].content.answer,
				memory: messages[workerID].content.memory,
				time: messages[workerID].content.time,
				filename: messages[workerID].content.filename,
				diff: messages[workerID].content.diff
			}
		});
		workers[workerID].on("message", function (message) {
			if (stop) {
				return;
			}
			console.log(message);
		});
		workers[workerID].on("error", function (error) {
			if (stop) {
				return;
			}
			console.log("Judger: Worker" + workerID + " has an uncaught exception:", error);
		});
		workers[workerID].on("exit", function () {
			if (stop) {
				return;
			}
			if (--workerCount < maxWorkerCount) {
				messageBus.listen("judger" + process.pid, "judger", start, 1, portNumber);
			}
		});
	});
	messageBus.listen("judger" + process.pid, "judger", start, maxWorkerCount, portNumber);
} else {
	if (fs.existsSync("workdir/" + process.pid + "/" + workerThreads.workerData.id)) {
		rmdirSyncRec("workdir/" + process.pid + "/" + workerThreads.workerData.id);
	}
	fs.mkdirSync("workdir/" + process.pid + "/" + workerThreads.workerData.id);
	fs.writeFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/input", workerThreads.workerData.input);
	fs.writeFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/answer", workerThreads.workerData.answer);
	fs.writeFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/executer_parameter", workerThreads.workerData.time + " " + workerThreads.workerData.memory + " workdir/" + process.pid + "/" + workerThreads.workerData.id + "/input workdir/" + process.pid + "/" + workerThreads.workerData.id + "/output workdir/binaries /" + workerThreads.workerData.filename);
	childProcess.exec("./executer workdir/" + process.pid + "/" + workerThreads.workerData.id + "/executer_parameter workdir/" + process.pid + "/" + workerThreads.workerData.id + "/executerOutput", function () {
		var executerOutput = fs.readFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/executerOutput").toString();
		if (executerOutput == "PLEASE RUN AS ROOT!") {
			throw "Executer error: " + executerOutput;
		}
		if (executerOutput.indexOf("ERROR") == 0) {
			throw "Executer error: " + executerOutput;
		}
		executerOutput = JSON.parse(executerOutput);
		if (executerOutput.incorrectness) {
			workerThreads.parentPort.postMessage({
				score: 0,
				result: executerOutput.incorrectness,
				memoryUsage: executerOutput.memoryUsage,
				timeSpent: executerOutput.time,
				additionalInformation: null,
				ret: null
			});
			rmdirSyncRec("workdir/" + process.pid + "/" + workerThreads.workerData.id);
			return;
		}
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
			rmdirSyncRec("workdir/" + process.pid + "/" + workerThreads.workerData.id);
		});
	});
}