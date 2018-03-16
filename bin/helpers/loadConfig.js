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
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (customConfig.hasOwnProperty(key)) {
			if (typeof customConfig[key] === typeof {}) {
				config[key] = Object.assign(config[key], customConfig[key]);
				if (customConfig[key].hasOwnProperty("options")) {
					config[key].options = {
						...config[key].options,
						...customConfig[key].options,
					};
				}
			} else {
				config[key] = customConfig[key];
			}
		}
	}
	
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