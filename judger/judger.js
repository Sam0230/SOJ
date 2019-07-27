#!/usr/bin/env node

throw "NOT COMPELETE !!!";

var workerThreads = require("worker_threads"),
	fs = require("fs"),
	childProcess = require("child_process");

function readFileToArr(fReadName, callback) {
	var fRead = fs.createReadStream(fReadName);
	var objReadline = readline.createInterface({
		input: fRead
	});
	var arr = new Array();
	objReadline.on('line', function (line) {
		arr.push(line);
		//console.log('line:'+ line);
	});
	objReadline.on('close', function () {
		// console.log(arr);
		callback(arr);
	});
}

function rmdirSyncRec(path) {
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
		rmdirSyncRec("workdir/" + process.pid);
	});
	process.on("SIGINT", function () {
		process.exit();
	});
	process.on("SIGHUP", function () {
		process.exit();
	});
	setTimeout(function () {
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
			console.log("Judger: Worker has an uncaught exception:", error);
		});
		worker.on("exit", function () {
			console.log("Judger: Worker exited.");
		});
	}, 0);
} else {
	if (fs.existsSync("workdir/" + process.pid + "/" + workerThreads.workerData.id)) {
		fs.rmdirSync("workdir/" + process.pid + "/" + workerThreads.workerData.id);
	}
	fs.mkdirSync("workdir/" + process.pid + "/" + workerThreads.workerData.id);
	fs.writeFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/input", workerThreads.workerData.input);
	fs.writeFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/answer", workerThreads.workerData.answer);
	fs.writeFileSync("workdir/" + process.pid + "/" + workerThreads.workerData.id + "/executer_parameter", workerThreads.workerData.time + " " + workerThreads.workerData.memory + " workdir/" + process.pid + "/" + workerThreads.workerData.id + "/input workdir/" + process.pid + "/" + workerThreads.workerData.id + "/output workdir/binaries /" + workerThreads.workerData.filename);
	childProcess.exec("./execute workdir/" + process.pid + "/" + workerThreads.workerData.id + "/executer_parameter workdir/" + process.pid + "/" + workerThreads.workerData.id + "/executerOutput", function () {
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