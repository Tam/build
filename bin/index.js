#! /usr/bin/env node

!async function () {
	switch (process.argv[2]) {
		case "init":
			require("./init");
			return;
		case "once":
			// TODO: Production build
			return;
		default:
			// TODO: Development build / watch
	}
}();