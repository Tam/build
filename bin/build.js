const config = require("./config")
	, GUI = require("./GUI");

const gui = new GUI(config);

const reload = () => {}
	, manifest = (entry, output) => {};

if (config.less.run)
	new (require("./build/less"))(config.less, gui.less, reload, manifest);