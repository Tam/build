#! /usr/bin/env node

const config = require("./helpers/loadConfig")
	, chalk = require("chalk")
	, spin = require('term-spinner')
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

if (config.__isDefault) {
	console.log(
		chalk.bold.keyword("orange")("No config file found, using default")
	);
} else if (config.__hasError) {
	console.error(chalk.bold.red("Config Error: ") + config.__hasError);
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

const spinner = spin.new(spin.types.Spin5);
const spinner2 = spin.new(spin.types.Spin5);

let isFirst = true;

// TODO: Probably don't use animated spinner
setInterval(function () {
	if (!isFirst)
		process.stdout.moveCursor(0, -3);
	
	isFirst = false;
	
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	
	spinner.next();
	process.stdout.write([
		// chalk.bold.yellow(spinner.current),
		chalk.bold.green("✓"),
		"Less"
	].join(" "));
	
	process.stdout.write("\n");
	
	spinner2.next();
	process.stdout.write([
		chalk.bold.yellow(spinner2.current),
		"JS" // NOTE: The spinner only takes up 1 char while the ✓ & ✘ take up  (on JetBrains terminal)
	].join(" "));
	
	process.stdout.write("\n");
	
	process.stdout.write([
		chalk.bold.red("✘"),
		"Critical"
	].join(" "));
	
	process.stdout.write("\n");
}, 100);

if (process.argv.slice(2)[0] === "once") {
	// TODO: Run tasks once then close
} else {
	startBrowserSync();
	
	// TODO: Watch dirs
}