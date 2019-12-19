const merge = require('deepmerge')
	, fs = require('fs')
	, nodeEnv = require('../helpers/getNodeEnv')
	, { UI_register, UI_message } = require('../gui');

UI_register('config', 'Config');

const mergeOpts = {
	// Overwrite arrays instead of merging them
	arrayMerge: (destinationArray, sourceArray, options) => sourceArray,
};

// Load our default config
let config = require('./default');
let usingDefaultConfig = true;

// Get the package.json config
const pkg = require(process.cwd() + '/package.json');

if (pkg && pkg.hasOwnProperty('build')) {
	usingDefaultConfig = false;
	UI_message('config', 'Loaded config from package.json');
	config = merge(
		config,
		pkg.build,
		mergeOpts
	);
}

// Get the build.config.js
const bcPath = process.cwd() + '/build.config.js';
if (fs.existsSync(bcPath)) {
	usingDefaultConfig = false;
	UI_message('config', 'Loaded config from build.config.js');
	const buildConfig = require(bcPath);
	config = merge(
		config,
		buildConfig,
		mergeOpts
	);
}

// Enforce certain settings depending on environment
if (nodeEnv() !== 'PRODUCTION') {
	// Disable critical from running in non-production environment
	config.critical.run = false;
}

// Prevent anything from modifying the config
Object.freeze(config);

// Export the loaded config
if (usingDefaultConfig)
	UI_message('config', 'Using default config');

module.exports = config;
