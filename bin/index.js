#! /usr/bin/env node
const fs = require("fs")
	, path = require("path")
	, program = require("commander");

const targetDir = process.cwd()
	, version = require("../package.json").version;

// Commands
// =========================================================================

program
	.version(version)
	.option("--less", "Compile less only")
	.option("--js", "Compile JS only")
	.option("--no-watch", "Don't watch, will compile then exit")
	.parse(process.argv);

// Config
// =========================================================================

let config = {
	"less": {
		"ignore": false,
		"input":  "public/assets/less/style.less",
		"output": "public/assets/css",
		"watch":  ["public/assets/less/**/*"]
	},
	"js": {
		"ignore": false,
		"input":  "public/assets/js/app.js",
		"output": "public/assets/js/app.min.js",
		"watch":  [
			"public/assets/js/**/*.js",
			"!public/assets/js/**/*.min.js"
		]
	},
	"browserSync": {
		"ignore": false,
		"proxy": "LOCAL_URL.dev",
		"watch": ["craft/templates/**/*"]
	}
};

try {
	let customConfig = JSON.parse(
		fs.readFileSync(
			path.join(targetDir, ".buildrc")
		)
	);
	
	// Merge shallow for each config group (i.e. less, js, etc.)
	const keys = Object.keys(config);
	for (let i = 0; i < keys.length; i++)
		if (customConfig.hasOwnProperty(keys[i]))
			config[keys[i]] = Object.assign(config[keys[i]], customConfig[keys[i]]);
} catch (_) {
	// Eh
}

// Build
// =========================================================================

console.log(config);

if (!program.watch) {
	// TODO: Don't watch
	console.log("NO WATCH");
}

if (program.less) {
	// TODO: Build less only
	console.log("LESS ONLY");
}

if (program.js) {
	// TODO: Build JS only
	console.log("JS ONLY");
}