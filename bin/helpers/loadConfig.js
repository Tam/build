const fs = require("fs")
	, config = require("../const").config
	, chalk = require("chalk")
	, getPath = require("./getPath");

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
		console.log(
			chalk.bold.keyword("orange")("No config file found, using default")
		);
	} else {
		// If there was a parsing error
		console.error(chalk.bold.red("Config Error: ") + err.message);
	}
}

module.exports = config;