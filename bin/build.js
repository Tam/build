const config = require("./config")
	, GUI = require("./GUI");

const gui = new GUI(config);

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
	new (require("./build/less"))(config.less, gui.less, reload, manifest);

// JS
// =========================================================================

if (config.js.run)
	new (require("./build/js"))(config.js, gui.js, reload, manifest);