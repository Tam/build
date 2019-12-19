const merge = require('deepmerge')
	, fs = require('fs')
	, nodeEnv = require('../helpers/getNodeEnv')
	, { UI_register, UI_message } = require('../gui');

UI_register('config', 'Config');

const mergeOpts = {
	// Overwrite arrays instead of merging them
	arrayMerge: (destinationArray, sourceArray, options) => sourceArray,

	// Custom merging rules
	customMerge: key => {
		// Always overwrite entry and paths items
		if (key === 'entry' || key === 'paths')
			return (_, b) => b;
	},
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
	const wasUsingDefault = usingDefaultConfig;
	usingDefaultConfig = false;
	UI_message('config', 'Loaded config from build.config.js');
	const buildConfig = require(bcPath);
	config = merge(
		config,
		buildConfig,
		// Only custom merge if this is the first user defined config we've found
		wasUsingDefault ? mergeOpts : {}
	);
}

// Enforce certain settings depending on environment
if (nodeEnv() !== 'production') {
	// Disable critical from running in non-production environment
	config.critical.run = false;
}

// Prevent anything from modifying the config
Object.freeze(config);

// Export the loaded config
if (usingDefaultConfig)
	UI_message('config', 'Using default config');

module.exports = config;
