#! /usr/bin/env node

const config = require("./helpers/loadConfig")
	, chalk = require("chalk")
	, clearConsole = require("./helpers/clearConsole")
	, lessBuild = require("./build/less");

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

// Output
// =========================================================================

clearConsole();

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

const STATUSES = {
	WORKING: "working",
	SUCCESS: "success",
	FAILURE: "failure",
};

// TODO: Move to consts
const STAT = {
	ignored: false,
	status: STATUSES.SUCCESS,
	errors: "",
	time: "" // µ
};
const stats = {
	less: Object.assign({ name: "LESS" }, STAT),
	js: Object.assign({ name: "JS" }, STAT),
	critical: Object.assign({ name: "Critical" }, STAT),
};

function draw () {
	clearConsole();
	
	if (config.__isDefault) {
		console.log(
			chalk.bold.keyword("orange")("No config file found, using default")
		);
	} else if (config.__hasError) {
		console.error(chalk.bold.red("Config Error: ") + config.__hasError);
	}
	
	const v = Object.values(stats);
	for (let i = 0, l = v.length; i < l; ++i) {
		const s = v[i];
		
		let icon = chalk.bold.gray("○");
		
		if (!s.ignored) {
			switch (s.status) {
				case STATUSES.WORKING:
					icon = chalk.bold.yellow("►");
					break;
				case STATUSES.SUCCESS:
					icon = chalk.bold.green("✓");
					break;
				case STATUSES.FAILURE:
					icon = chalk.bold.red("✘");
					break;
			}
		}
		
		let msg = icon + " " + s.name + " " + chalk.blue(s.time);
		
		if (s.ignored)
			msg = chalk.dim(msg);
		
		console.log(msg);
	}
	
	// TODO: Show errors
}

// TODO: Make accessible from build files
function updateStats (key, nextStats) {
	stats[key] = Object.assign(stats[key], nextStats);
	draw();
}

draw();

if (process.argv.slice(2)[0] === "once") {
	// TODO: Run tasks once then close
} else {
	startBrowserSync();
	
	// TODO: Watch dirs
}

setTimeout(() => {
	updateStats("js", { status: STATUSES.WORKING });
	
	setTimeout(() => {
		updateStats("js", { status: STATUSES.FAILURE });
	}, 1000);
}, 1000);