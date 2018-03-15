const CONSTS = require("./const");

const STATUSES = CONSTS.STATUSES
	, DEFAULT_STAT = CONSTS.DEFAULT_STAT
	, clearConsole = require("./helpers/clearConsole")
	, chalk = require("chalk")
	, prettyTime = require("pretty-hrtime")
	, config = require("./helpers/loadConfig");

const stats = {
	less: Object.assign({ name: "LESS" }, DEFAULT_STAT),
	js: Object.assign({ name: "JS" }, DEFAULT_STAT),
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
				case STATUSES.WARNING:
					icon = chalk.bold.keyword("orange")("⚠");
					break;
				case STATUSES.FAILURE:
					icon = chalk.bold.red("✘");
					break;
			}
		}
		
		let msg = icon + " " + s.name + " ";
		if (s.time)
			msg += chalk.blue(prettyTime(s.time));
		
		if (s.ignored)
			msg = chalk.dim(msg);
		
		console.log(msg);
	}
	
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
};