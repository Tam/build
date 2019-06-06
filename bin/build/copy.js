const path = require("path")
	, chokidar = require("chokidar")
	, ncp = require("ncp").ncp
	, rimraf = require("rimraf");

class Copy {

	constructor (config, gui) {
		this.config = config;
		this.gui = gui;
		this.running = 0;

		this.paths = Object.entries(config.paths).map(([ from, to ]) => ({
			from,
			to: path.join(config.basePath, to),
		}));

		return new Promise(async resolve => {
			if (process.env.NODE_ENV !== "production")
				this.startWatchers();

			await this.paths.forEach(path => this.run(path));

			resolve();
		});
	}

	// Actions
	// =========================================================================

	startWatchers () {
		this.paths.forEach(path => {
			const watcher = chokidar.watch(path.from, {
				ignoreInitial: true,
				ignorePermissionErrors: true,
			});

			watcher.on('all', this.run.bind(this, path));
		});
	}

	async run ({ from, to }) {
		return new Promise(async resolve => {
			this._run();

			await new Promise(resolve => {
				rimraf(to, resolve);
			});

			ncp(from, to, { dereference: true }, err => {
				err && (err + '').indexOf('EEXIST') === -1 && this.gui.error(err);
				this._complete();
				resolve();
			});
		});
	}

	// Helpers
	// =========================================================================

	_run () {
		if (this.running === 0)
			this.gui.run();

		this.running++;
	}

	_complete () {
		this.running--;

		if (this.running === 0)
			this.gui.complete();
	}

}

module.exports = Copy;