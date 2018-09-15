const config = require("./config")
	, GUI = require("./GUI");

const gui = new GUI(config);

// Manifest
let manifest;
if (config.manifest === null)
	manifest = (entry, output) => {};
else
	manifest = new (require("./build/manifest"))(config);

const reload = () => {};

if (config.less.run)
	new (require("./build/less"))(config.less, gui.less, reload, manifest);