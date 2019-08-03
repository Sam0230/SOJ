var fs = require("fs");

var cpdirSync = function rmdirSyncRec(from, dst, dirMode) {
	if (!fs.existsSync(dst)) {
		var oldumask = process.umask(0o000);
		fs.mkdirSync(message.content.path, {
			mode: fs.lstat(dst).mode,
			recursive: true
		});
		process.umask(oldumask);
	}
	if (dirMode=="keep") {
		fs.mkdirSync
	}
	fs.readdirSync(path).forEach(function (file, index) {
		var currentPath = path + "/" + file;
		if (fs.lstatSync(currentPath).isDirectory()) {
			cpdirSync(currentPath);
			fs.existsSync(dst)
		} else {
			fs.unlinkSync(currentPath);
		}
	});
	fs.rmdirSync(path);
};

copyFolder('a', 'b', function (err) {
	if (err) {
		return
	}
})