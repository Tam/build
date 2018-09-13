#! /usr/bin/env node

!async function () {
	switch (process.argv[2]) {
		case "init":
			require("./init");
			return;
		case "once":
			process.env.NODE_ENV = "production";
			require("./build");
			return;
		default:
			require("./build");
	}
}();