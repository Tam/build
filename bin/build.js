#! /usr/bin/env node

const config = require("./helpers/loadConfig")
	, getPath = require("./helpers/getPath")
	, output = require("./output")
	, chokidar = require("chokidar")
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
		// open: "external",
		open: false,
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
	if (!config.less.ignore)
		lessCompiler.run();
} else {
	startBrowserSync();
	
	function groupPaths (paths) {
		return paths.map(getPath).reduce((a, b) => {
			if (b[0] === "!") a[1].push(b.slice(1, b.length));
			else a[0].push(b);
			return a;
		}, [[/* watch */], [/* ignore */]]);
	}
	
	if (!config.less.ignore) {
		const [watch, ignore] = groupPaths(config.less.watch);
		
		chokidar.watch(watch, {
			ignore,
			ignoreInitial: true,
			ignorePermissionErrors: true,
		}).on("all", () => {
			lessCompiler.run(reload);
		});
	}
}