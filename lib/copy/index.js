const path = require('path')
	, config = require('../config')
	, chokidar = require('chokidar')
	, ncp = require('ncp').ncp
	, rimraf = require('rimraf')
	, { UI_register, UI_message, UI_error, UI_run, UI_complete } = require('../gui')
	, nodeEnv = require('../helpers/getNodeEnv');

UI_register('copy', 'Copy');

// Variables
// =========================================================================

const paths = Object.entries(config.copy.paths).map(([ from, to ]) => ({
	from,
	to: path.join(config.copy.basePath, to),
}));

let running = 0;

// Methods
// =========================================================================

/**
 * Start watching the files for changes
 */
function startWatchers () {
	UI_message('copy', 'Starting watchers');

	for (let i = 0, l = paths.length; i < l; i++) {
		const watcher = chokidar.watch(paths[i].from, {
			ignoreInitial: true,
			ignorePermissionErrors: true,
		});

		watcher.on('all', () => copy(paths[i]));
	}
}

/**
 * Copy the given path
 *
 * @param {{from:string, to:string}} path - The path pair to copy
 * @param {boolean} silent - Will not log a "copying" message if true
 * @return {Promise<void>}
 */
async function copy (path, silent = false) {
	run();
	!silent && UI_message('copy', `Copying ${path.from} to ${path.to}`);

	try {
		// Delete the old path
		await new Promise((resolve, reject) => {
			rimraf(path.to, {}, err => {
				if (err) reject(err);
				else resolve();
			});
		});

		// Copy the new path
		await new Promise((resolve, reject) => {
			ncp(path.from, path.to, { dereference: true }, err => {
				err && (err + '').indexOf('EEXIST') === -1 && reject(err);
				resolve();
			});
		});
	} catch (e) {
		UI_error('copy', e);
	}

	complete();
}

// Export
// =========================================================================

module.exports = async () => {
	try {
		if (nodeEnv() !== 'production')
			startWatchers();

		UI_message('copy', 'Copying all files');
		for (let i = 0, l = paths.length; i < l; i++)
			await copy(paths[i], true);
	} catch (e) {
		UI_error('copy', e);
	}
};

// Helpers
// =========================================================================

/**
 * Start the copy task running (if it isn't already)
 */
function run () {
	if (running === 0)
		UI_run('copy');

	running++;
}

/**
 * Complete the copy task (if everything has finished running)
 */
function complete () {
	running--;

	if (running === 0)
		UI_complete('copy');
}
