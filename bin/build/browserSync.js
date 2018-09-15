const chokidar = require("chokidar")
	, watchIgnore = require("../helpers/watchIgnore");

class BrowserSync {

	constructor (config, gui) {
		this.gui = gui;
		this.init(config);
		this.watch(config);

		return this.reload.bind(this);
	}

	init (config) {
		this.sync = require("browser-sync").create();

		this.sync.init({
			open: false,
			proxy: config.proxy,
			host: config.proxy,
			watchEvents: [],
			notify: false,
			injectChanges: false,
			codeSync: false,
		});

		this.lastReload = process.hrtime();
	}

	watch (config) {
		const [watch, ignored] = watchIgnore(config.watch);

		chokidar.watch(watch, {
			ignored,
			ignoreInitial:          true,
			ignorePermissionErrors: true,
		}).on("all", () => {
			this.reload();
			this.gui.render();
		});
	}

	reload () {
		// If the last time we tried to reload was a second ago (or less),
		// don't reload again
		if (process.hrtime(this.lastReload)[0] <= 1)
			return;

		this.lastReload = process.hrtime();
		this.sync.reload();
	}

}

module.exports = BrowserSync;