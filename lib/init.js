const fs = require('fs')
	, chalk = require('chalk')
	, inquirer = require('inquirer');

!async function () {
	// Ensure we want to create a config file
	const { sure } = await inquirer.prompt([{
		type: 'confirm',
		name: 'sure',
		message: 'build no longer requires a config file (see the README.md for more info), are you sure you want to continue?',
		default: true,
	}]);

	if (!sure)
		return;

	// Check if a config file already exists
	if (fs.existsSync('build.config.js')) {
		const { overwrite } = await inquirer.prompt([{
			type: 'confirm',
			name: 'overwrite',
			message: 'build.config.js already exists, overwrite?',
			default: false,
		}]);

		if (!overwrite)
			return;
	}

	// Write the config file
	const defaultConfig = fs.readFileSync(
		__dirname + '/config/default.js',
		'utf8'
	);

	fs.writeFile('build.config.js', defaultConfig, err => {
		if (err) throw err;
		console.log(chalk.bold.green('The config file has been saved!'));
	});
}();
