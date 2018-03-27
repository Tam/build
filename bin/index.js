#! /usr/bin/env node

const build = require("./build");

require("./update");

!async function () {
	const args = process.argv.slice(2);
	
	switch (args[0]) {
		case "init":
			require("./init");
			return;
		case "once":
			await build(true);
			process.exit();
			return;
		default:
			await build();
	}
}();