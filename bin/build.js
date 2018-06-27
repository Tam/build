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

let browserSync;
let lastReloadTime = process.hrtime();

const reload = () => {
	if (config.browserSync.ignore)
		return;
	
	// If the last time we tried to reload was a second ago (or less),
	// don't reload again
	if (process.hrtime(lastReloadTime)[0] <= 1)
		return;
	
	lastReloadTime = process.hrtime();
	
	browserSync.reload();
};

const startBrowserSync = () => {
	browserSync = require("browser-sync").create();
	
	browserSync.init({
		open: false,
		proxy: config.browserSync.proxy,
		host: config.browserSync.proxy,
		watchEvents: [],
		notify: false,
	});
};

// Build
// =========================================================================

output.draw();

// Once
// -------------------------------------------------------------------------

async function once () {
	if (!config.less.ignore)
		await lessCompiler();
	
	if (!config.js.ignore)
		await jsCompiler();
	
	if (!config.critical.ignore)
		await criticalCompiler();
	
	process.exit();
}

function watch () {
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
		startBrowserSync();
		
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

module.exports = async function build (buildOnce = false) {
	if (buildOnce) {
		await once();
		process.exit();
	} else {
		watch();
	}
};
