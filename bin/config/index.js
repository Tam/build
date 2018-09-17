const deepmerge = require("deepmerge");

let config;

try {
	config = require(process.cwd() + "/build.config.js");
} catch (e) {
	config = require("./default");
}

config = deepmerge(
	require("./config"),
	config
);

if (process.env.NODE_ENV !== "production")
	config.critical.run = false;

module.exports = config;