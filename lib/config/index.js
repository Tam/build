const merge = require('deepmerge')
	, fs = require('fs');

// Load our default config
let config = require('./default');

// Get the package.json config
const pkg = require(process.cwd() + '/package.json');

if (pkg && pkg.hasOwnProperty('build')) {
	config = merge(
		config,
		pkg.build
	);
}

// Get the build.config.js
const bcPath = process.cwd() + '/build.config.js';
if (fs.existsSync(bcPath)) {
	const buildConfig = require(bcPath);
	config = merge(
		config,
		buildConfig
	);
}

// Enforce certain settings depending on environment
if ((process.env.NODE_ENV || '').toUpperCase() !== 'PRODUCTION') {
	// Disable critical from running in non-production environment
	config.critical.run = false;
}

// Prevent anything from modifying the config
Object.freeze(config);

// Export the loaded config
module.exports = config;
