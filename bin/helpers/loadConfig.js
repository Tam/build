const fs = require("fs")
	, config = require("../const").config
	, getPath = require("./getPath");

let cachedConfig = null;

if (cachedConfig) {
	module.exports = cachedConfig;
	return;
}

/**
 * Will merge b into a
 *
 * @param a
 * @param b
 * @return {*}
 */
function merge (a, b) {
	const c = {...a};
	
	const keys = Object.keys(c);
	
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		
		if (b.hasOwnProperty(key)) {
			if (b[key] && typeof b[key] === typeof {}) {
				c[key] = Object.assign(c[key], b[key]);
				
				if (b[key].hasOwnProperty("options")) {
					c[key].options = {
						...c[key].options,
						...b[key].options,
					};
				}
			} else {
				c[key] = b[key];
			}
		}
	}
	
	return c;
}

let nextConfig = config;

// Load and parse `.buildrc` or fall back to the default config
try {
	// Attempt to load & parse the file
	let customConfig = JSON.parse(fs.readFileSync(getPath(".buildrc")));
	
	// Is this a multi-env config?
	if (customConfig.hasOwnProperty("*")) {
		if (customConfig.hasOwnProperty(process.env.NODE_ENV)) {
			customConfig = merge(
				merge(config, customConfig["*"]),
				customConfig[process.env.NODE_ENV]
			);
		} else
			customConfig = customConfig["*"];
	}
	
	// Merge shallow for each config group (i.e. less, js, etc.)
	nextConfig = merge(nextConfig, customConfig);
	
} catch (err) {
	// If we don't have a file
	if (err.message.indexOf("no such file") > -1) {
		nextConfig.__isDefault = true;
	} else {
		// If there was a parsing error
		nextConfig.__hasError = err.message;
	}
}

cachedConfig = nextConfig;
module.exports = nextConfig;
