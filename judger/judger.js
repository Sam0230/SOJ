#!/usr/bin/env node

throw "NOT FINISHED !!!";

var workerThreads = require("worker_threads"),
	fs = require("fs"),
	childProcess = require("child_process");

function rmdirSyncRec(path) {
	return;
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
		fs.rmdirSync("workdir/" + process.pid);
	}
	fs.mkdirSync("workdir/" + process.pid);
	process.on("exit", function () {
		rmdirSyncRec("workdir/" + process.pid);
	});
	process.on("SIGINT", function () {
		rmdirSyncRec("workdir/" + process.pid);
	});
	process.on("SIGHUP", function () {
		rmdirSyncRec("workdir/" + process.pid);
	});
	var worker = new workerThreads.Worker(__filename, {
		workerData: {
			id: 3,
			input: "10 20",
			answer: "30",
			memory: 8192,
			time: 100,
			filename: "123454321",
			diff: "./standard_judge"
		}
	});
	worker.on("message", function (message) {
		console.log("Judger: Message from worker:", message);
	});
	worker.on("error", function (error) {
		console.log("Judger: Worker has an uncaught exception", error);
	});
	worker.on("exit", function () {
		console.log("Judger: Worker exited.");
	});
} else {
	if (fs.existsSync("workdir/" + process.pid + "/" + workerThreads.workerData.id)) {
		fs.rmdirSync("workdir/" + process.pid + "/" + workerThreads.workerData.id);
	}
	fs.mkdirSync("workdir/" + process.pid + "/" + workerThreads.workerData.id);
	fs.writeFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/input", workerThreads.workerData.input);
	fs.writeFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/answer", workerThreads.workerData.answer);
	fs.writeFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/parameter", workerThreads.workerData.time + " " + workerThreads.workerData.memory + " workdir/" + process.pid + "/" + workerThreads.workerData.id + "/input workdir/" + process.pid + "/" + workerThreads.workerData.id + "/output workdir/binaries /" + workerThreads.workerData.filename);
	childProcess.exec("./execute workdir/" + process.pid + "/" + workerThreads.workerData.id + "/parameter workdir/" + process.pid + "/" + workerThreads.workerData.id + "/executer_output", function () {
		workerThreads.parentPort.postMessage("Finished!");
	});
}