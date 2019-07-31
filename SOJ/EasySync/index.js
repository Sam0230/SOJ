var uvRunOnce;

try {
	uvRunOnce = require("./build/Release/uvRunOnce.node");
} catch (err) {
	if (err.code == "MODULE_NOT_FOUND") {
		var install_finish;
		console.log("Please run EasySync/build.sh to build uvRunOnce.node first.");
		process.exit();
	}
}

module.exports = function (asyncFunction) {
	var ret, solved = false;
	asyncFunction(function (result) {
		ret = result;
		solved = true;
	});
	while (!solved) {
		process._tickCallback(); // If node's version is below 11.0, uvRunOnce will only run the next microtask.
		if (!solved) {
			uvRunOnce.uvRunOnce();
		}
	}
	return ret;
}