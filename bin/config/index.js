const deepmerge = require("deepmerge");

let config = require("./config");

try {
	config = deepmerge(
		config,
		require(process.cwd() + "/build.config.js")
	);
} catch (e) {
	config = deepmerge(
		config,
		require("./default")
	);
}

module.exports = config;