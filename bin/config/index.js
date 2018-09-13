const deepmerge = require("deepmerge");

let config;

try {
	config = require(process.cwd() + "/build.config.js");
} catch (e) {
	config = require("./default");
}

module.exports = deepmerge(
	require("./config"),
	config
);