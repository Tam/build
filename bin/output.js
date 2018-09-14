const trackTime = require("./helpers/trackTime")
	, clone = require("./helpers/clone")
	, chalk = require("chalk")
	, table = require("text-table")
	, prettyTime = require("pretty-hrtime");

class Output {

	// Properties
	// =========================================================================

	constructor (config) {
		const _default = {
			name: "",
			running: false,
			timer: null,
			runTime: null,
			messages: [],
			warnings: [],
			errors: [],
		};

		if (config.less.run) {
			this._less = clone(_default);
			this._less.name = "Less";
		}

		if (config.js.run) {
			this._js = clone(_default);
			this._js.name = "JS";
		}

		if (config.critical.run) {
			this._critical = clone(_default);
			this._critical.name = "Critical";
		}

		this._render();
	}

	// Runners
	// =========================================================================

	get less () {
		return this._get("_less");
	}

	get js () {
		return this._get("_js");
	}

	get critical () {
		return this._get("_critical");
	}

	_get (runner) {
		return {
			run: this.run.bind(this, runner),
			complete: this.complete.bind(this, runner),
			message: this.message.bind(this, runner, "messages"),
			warning: this.message.bind(this, runner, "warnings"),
			error: this.message.bind(this, runner, "errors"),
		};
	}

	// Actions
	// =========================================================================

	run (runner) {
		this[runner].running = true;

		this[runner].timer = trackTime();
		this[runner].timer.start();

		this[runner].messages = [];
		this[runner].warnings = [];
		this[runner].errors = [];

		this._render();
	}

	message (runner, type, message) {
		if (Array.isArray(message))
			this[runner][type].concat(message);
		else
			this[runner][type].push(message);

		this._render();
	}

	complete (runner) {
		this[runner].running = false;
		this[runner].runTime = this[runner].timer.stop();

		this._render();
	}

	// Renderer
	// =========================================================================

	_render () {
		// Clear console
		process.stdout.write(
			process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
		);

		// Get runners
		const runners = Object.values(this);

		// Running statuses
		const runningStatuses = runners.map(runner => {
			let icon = chalk.bold.gray("○");

			if (runner.running) icon = chalk.bold.yellow("►");
			else if (runner.errors.length) icon = chalk.bold.red("✘");
			else if (runner.warnings.length) icon = chalk.bold.yellow("!");
			else icon = chalk.bold.green("✓");

			let time = chalk.gray("Not run");
			if (runner.runTime)
				time = chalk.cyanBright(prettyTime(runner.runTime));

			return [
				icon,
				runner.name,
				time,
			];
		});

		console.log(table(runningStatuses, {
			align: ["l", "l", "l"],
			stringLength(str) {
				return chalk.reset(str).length;
			},
		}));

		console.log(/* Divider */);

		// Messages
		runners.map((runner, i) => {
			if (runner.errors.length) {
				console.log(
					chalk.bold.red(runner.name + " Errors:")
				);

				console.log(runner.errors.join("\n"));
			} else if (runner.warnings.length) {
				console.log(
					chalk.bold.keyword("orange")(runner.name + " Warnings:")
				);

				console.log(runner.warnings.join("\n"));
			} else if (runner.messages.length) {
				console.log(
					chalk.bold.blue(runner.name + " Messages:")
				);

				console.log(runner.messages.join("\n"));
			} else return;

			if (i !== runners.length - 1)
				console.log(/* Divider */);
		});
	}

}

module.exports = Output;