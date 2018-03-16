#! /usr/bin/env node

const spawn = require("cross-spawn");

function build (args) {
	// Spawn the build process
	const result = spawn.sync(
		'node',
		[ require.resolve("./build") ].concat(args),
		{ stdio: 'inherit' }
	);
	
	// Handle a loss of signal
	if (!result.signal) {
		process.exit(result.status);
		return;
	}
	
	// Handle an error signal
	if (result.signal === "SIGKILL") {
		console.log(
			'The build failed because the process exited too early. ' +
			'This probably means the system ran out of memory or someone called ' +
			'`kill -9` on the process.'
		);
	} else if (result.signal === "SIGTERM") {
		console.log(
			'The build failed because the process exited too early. ' +
			'Someone might have called `kill` or `killall`, or the system could ' +
			'be shutting down.'
		);
	}
	
	process.exit(1);
}

!function () {
	const args = process.argv.slice(2);
	
	switch (args[0]) {
		case "init":
			require("./init");
			return;
		case "once":
		default:
			build(args);
	}
	
	require("./update");
}();