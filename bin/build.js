#! /usr/bin/env node

const config = require("./helpers/loadConfig")
	, output = require("./output")
	, clearConsole = require("./helpers/clearConsole")
	, lessCompiler = require("./build/less");

// Validate Config
// =========================================================================

const iA = typeof config.js.input === typeof []
	, oA = typeof config.js.output === typeof [];

if (!config.js.ignore) {
	if (iA && !oA || !iA && oA)
		throw "Your JS inputs and outputs must be of the same type";
	
	if (iA && oA && config.js.input.length !== config.js.output.length)
		throw "Your JS input & output arrays must match in length";
}

// Tasks
// =========================================================================

// Browser Sync
// -------------------------------------------------------------------------

const browserSync = require("browser-sync").create();

const reload = () => {
	if (!config.browserSync.ignore)
		browserSync.reload();
};

const startBrowserSync = () => {
	browserSync.init({
		open: "external",
		proxy: config.browserSync.proxy,
		host: config.browserSync.proxy,
		watchEvents: ["add", "change", "unlink", "addDir", "unlinkDir"],
		notify: false,
	});
};

// Build
// =========================================================================

output.draw();

if (process.argv.slice(2)[0] === "once") {
	// TODO: Run tasks once then close
	if (!config.less.ignore)
		lessCompiler.run();
} else {
	startBrowserSync();
	
	// TODO: Watch dirs
}