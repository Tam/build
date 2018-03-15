const config = require("./const").config
	, fs = require("fs")
	, chalk = require("chalk");

/**
 * Create the .buildrc file using the default config
 */
fs.writeFile(".buildrc", JSON.stringify(config, null, "\t"), (err) => {
	if (err) throw err;
	console.log(chalk.bold.green("The config file has been saved!"));
});