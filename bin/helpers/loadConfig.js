const fs = require("fs")
	, config = require("../const").config
	, getPath = require("./getPath");

let cachedConfig = null;

if (cachedConfig) {
	module.exports = cachedConfig;
	return;
}

// Load and parse `.buildrc` or fall back to the default config
try {
	// Attempt to load & parse the file
	let customConfig = JSON.parse(fs.readFileSync(getPath(".buildrc")));
	
	// Merge shallow for each config group (i.e. less, js, etc.)
	const keys = Object.keys(config);
	for (let i = 0; i < keys.length; i++)
		if (customConfig.hasOwnProperty(keys[i]))
			config[keys[i]] = Object.assign(config[keys[i]], customConfig[keys[i]]);
	
} catch (err) {
	// If we don't have a file
	if (err.message.indexOf("no such file") > -1) {
		config.__isDefault = true;
	} else {
		// If there was a parsing error
		config.__hasError = err.message;
	}
}

cachedConfig = config;
module.exports = config;