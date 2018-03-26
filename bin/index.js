#! /usr/bin/env node

require("./update");

!function () {
	const args = process.argv.slice(2);
	
	switch (args[0]) {
		case "init":
			require("./init");
			return;
		case "once":
		default:
			require("./build");
	}
}();