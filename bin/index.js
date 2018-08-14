#! /usr/bin/env node

const args = process.argv.slice(2);

if (args[0] === "once")
	process.env.NODE_ENV = "production";

const build = require("./build");

// require("./update");

!async function () {
	switch (args[0]) {
		case "init":
			require("./init");
			return;
		case "once":
			process.env.NODE_ENV = "production";
			await build(true);
			process.exit();
			return;
		default:
			await build();
	}
}();
