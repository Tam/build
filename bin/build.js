#! /usr/bin/env node

const config = require("./helpers/loadConfig")
	, getPath = require("./helpers/getPath")
	, output = require("./output")
	, chokidar = require("chokidar")
	, lessCompiler = require("./build/less")
	, jsCompiler = require("./build/js")
	, criticalCompiler = require("./build/critical");

// Browser Sync
// =========================================================================

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
	async function once () {
		if (!config.less.ignore)
			await lessCompiler();
		
		if (!config.js.ignore)
			await jsCompiler();
		
		if (!config.critical.ignore)
			await criticalCompiler();
	}
	
	once().catch(() => { /* Eh. */ });
} else {
	startBrowserSync();
	
	function groupPaths (paths) {
		return paths.map(getPath).reduce((a, b) => {
			if (b[0] === "!") a[1].push(b.slice(1, b.length));
			else a[0].push(b);
			return a;
		}, [[/* watch */], [/* ignore */"*.map"]]);
	}
	
	// Less
	// -------------------------------------------------------------------------
	if (!config.less.ignore) {
		const [watch, ignored] = groupPaths(config.less.watch);
		
		chokidar.watch(watch, {
			ignored,
			ignoreInitial:          true,
			ignorePermissionErrors: true,
		}).on("all", () => {
			lessCompiler(reload);
		});
	}
	
	// JS
	// -------------------------------------------------------------------------
	if (!config.js.ignore) {
		const [watch, ignored] = groupPaths(config.js.watch);
		
		chokidar.watch(watch, {
			ignored,
			ignoreInitial:          true,
			ignorePermissionErrors: true,
		}).on("all", () => {
			jsCompiler(reload);
		});
	}
	
	// BrowserSync
	// -------------------------------------------------------------------------
	if (!config.browserSync.ignore) {
		const [watch, ignored] = groupPaths(config.browserSync.watch);
		
		chokidar.watch(watch, {
			ignored,
			ignoreInitial:          true,
			ignorePermissionErrors: true,
		}).on("all", () => {
			output.draw();
			reload();
		});
	}
}