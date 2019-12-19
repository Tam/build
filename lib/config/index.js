const merge = require('deepmerge')
	, fs = require('fs')
	, nodeEnv = require('../helpers/getNodeEnv');

const mergeOpts = {
	// Overwrite arrays instead of merging them
	arrayMerge: (destinationArray, sourceArray, options) => sourceArray,
};

// Load our default config
let config = require('./default');

// Get the package.json config
const pkg = require(process.cwd() + '/package.json');

if (pkg && pkg.hasOwnProperty('build')) {
	config = merge(
		config,
		pkg.build,
		mergeOpts
	);
}

// Get the build.config.js
const bcPath = process.cwd() + '/build.config.js';
if (fs.existsSync(bcPath)) {
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
module.exports = config;
