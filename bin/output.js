const CONSTS = require("./const");

const STATUSES = CONSTS.STATUSES
	, DEFAULT_STAT = CONSTS.DEFAULT_STAT
	, clearConsole = require("./helpers/clearConsole")
	, chalk = require("chalk")
	, table = require("text-table")
	, prettyTime = require("pretty-hrtime")
	, config = require("./helpers/loadConfig");

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
	
	for (let i = 0, l = v.length; i < l; ++i) {
		const s = v[i];
		
		if (s.ignored)
			continue;
		
		switch (s.status) {
			case STATUSES.FAILURE:
				console.log(
					chalk.bold.red(s.name + " Errors:")
				);
				console.log(s.errors);
				break;
			case STATUSES.WARNING:
				console.log(
					chalk.bold.keyword("orange")(s.name + " Warnings:")
				);
				console.log(s.warnings);
				break;
		}
	}
}

function updateStats (key, nextStats, dontDraw = false) {
	stats[key] = Object.assign(stats[key], nextStats);
	if (!dontDraw) draw();
}

module.exports = {
	draw,
	updateStats,
	stats,
};