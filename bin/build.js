const config = require("./config")
	, Output = require("./output");

const output = new Output(config);

if (config.less.run)
	new (require("./build/less"))(config.less, output);