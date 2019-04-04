const config = require("./config")
	, GUI = require("./GUI");

const gui = new GUI(config);

async function run () {

	// Manifest
	// =========================================================================

	let manifest;
	if (config.manifest === null)
		manifest = (entry, output) => {};
	else
		manifest = new (require("./build/manifest"))(config);

	// BrowserSync
	// =========================================================================

	let reload;
	if (config.browserSync.run && process.env.NODE_ENV !== "production")
		reload = new (require("./build/browserSync"))(config.browserSync, gui);
	else
		reload = () => {};

	// Less
	// =========================================================================

	if (config.less.run)
		await new (require("./build/less"))(config.less, gui.less, reload, manifest);

	// JS
	// =========================================================================

	if (config.js.run)
		await new (require("./build/js"))(config.js, gui.js, reload, manifest);

	// Critical
	// =========================================================================

	if (config.critical.run)
		new (require("./build/critical"))(config.critical, gui.critical);

	// Copy
	// =========================================================================

	if (config.copy.run)
		new (require('./build/copy'))(config.copy, gui.copy);
}

try {
	run();
} catch (e) {
	console.error(e);
}
