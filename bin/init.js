const chalk = require("chalk")
	, inquirer = require("inquirer")
	, fs = require("fs");

!async function () {

	if (fs.existsSync("build.config.js")) {
		const { overwrite } = await inquirer.prompt([{
			type: "confirm",
			name: "overwrite",
			message: "build.config.js already exists, overwrite?",
			default: false,
		}]);

		if (!overwrite)
			return;
	}

	const defaultConfig = fs.readFileSync(
		__dirname + "/default.config.js",
		"utf8"
	);

	fs.writeFile("build.config.js", defaultConfig, err => {
		if (err) throw err;
		console.log(chalk.bold.green("The config file has been saved!"));
	});

}();