const CONSTS = require("./const");

const STATUSES = CONSTS.STATUSES
	, DEFAULT_STAT = CONSTS.DEFAULT_STAT
	, clearConsole = require("./helpers/clearConsole")
	, chalk = require("chalk")
	, table = require("text-table")
	, prettyTime = require("pretty-hrtime")
	, config = require("./helpers/loadConfig");

// Default stats
const stats = {
	less: Object.assign({}, DEFAULT_STAT, {
		name: "LESS",
		ignored: config.less.ignore,
	}),
	
	js: Object.assign({}, DEFAULT_STAT, {
		name: "JS",
		ignored: config.js.ignore,
	}),
};

/**
 * Formats the given error
 *
 * @param {Object} err
 * @returns {string}
 */
function formatError (err) {
	let e = err.message;
	
	if (err.hasOwnProperty("file"))
		e += " " + err.file;
	
	if (err.hasOwnProperty("line") && err.hasOwnProperty("column"))
		e += ` (${err.line}:${err.column})`;
	
	if (err.hasOwnProperty("extract")) {
		const extract = err.extract.split("\n")
			, formattedExtract = [];
		
		e += "\n\n";
		
		for (let i = 0, l = extract.length; i < l; ++i) {
			const line = extract[i];
			
			// Skip last line if empty
			if (i === l - 1 && !line.trim())
				continue;
			
			let f;
			if (i + 1 === Math.ceil((l % 2 === 0 ? l + 1 : l) / 2)) f = chalk.bgBlackBright(line);
			else f = line;
			
			formattedExtract.push(f);
		}
		
		e += formattedExtract.join("\n");
	}
	
	return e + "\n";
}

/**
 * Update the console
 */
function draw () {
	// Clear the console
	clearConsole();
	
	// Let the user know if there's no config, or a config error
	if (config.__isDefault) {
		console.log(
			chalk.bold.keyword("orange")("No config file found, using default")
		);
	} else if (config.__hasError) {
		console.error(chalk.bold.red("Config Error: ") + config.__hasError);
	}
	
	const v = Object.values(stats);
	
	// Update the current running status of each task
	let runningStatuses = [];
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
				case STATUSES.WARNING:
					icon = chalk.bold.yellow("!");
					break;
				case STATUSES.FAILURE:
					icon = chalk.bold.red("✘");
					break;
			}
		}
		
		let msg = [icon, s.name, chalk.gray(s.ignored ? "Ignored" : "Not run")];
		if (s.time)
			msg[2] = chalk.cyanBright(prettyTime(s.time));
		
		runningStatuses.push(msg);
	}
	
	console.log(table(runningStatuses, {
		align: ["l", "l", "l"],
		stringLength(str) {
			return chalk.reset(str).length;
		},
	}));
	
	console.log();
	
	// Output any errors or warnings from each task
	for (let i = 0, l = v.length; i < l; ++i) {
		const s = v[i];
		
		if (s.ignored)
			continue;
		
		let hasOutput = false;
		
		switch (s.status) {
			case STATUSES.FAILURE:
				console.log(
					chalk.bold.red(s.name + " Errors:")
				);
				console.log(s.errors.map(formatError).join());
				hasOutput = true;
				break;
			case STATUSES.WARNING:
				console.log(
					chalk.bold.keyword("orange")(s.name + " Warnings:")
				);
				console.log(s.warnings.map(formatError).join());
				hasOutput = true;
				break;
		}
		
		if (i !== l - 1 && hasOutput)
			console.log(chalk.gray("- - - - -\n"));
	}
}

function updateStats (key, nextStats, dontDraw = false) {
	stats[key] = Object.assign(stats[key], nextStats);
	if (!dontDraw) draw();
}

// Shortcuts
// =========================================================================

function working (key, nextStats = {}) {
	updateStats(key, { status: STATUSES.WORKING, ...nextStats, });
}

function success (key, nextStats = {}) {
	updateStats(key, { status: STATUSES.SUCCESS, ...nextStats, });
}

function warning (key, nextStats = {}) {
	updateStats(key, { status: STATUSES.WARNING, ...nextStats, });
}

function failure (key, nextStats = {}) {
	updateStats(key, { status: STATUSES.FAILURE, ...nextStats, });
}

module.exports = {
	draw,
	updateStats,
	stats,
	
	working,
	success,
	warning,
	failure,
};
