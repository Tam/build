const config = require('../config')
	, path = require('path')
	, fs = require('fs')
	, { UI_register, UI_message, UI_error, UI_run, UI_complete, UI_warning } = require('../gui')
	, nodeEnv = require('../helpers/getNodeEnv')
	, chokidar = require('chokidar')
	, sass = require('sass')
	, hashFilename = require('../helpers/hashFilename')
	, postCssProcessor = require('../helpers/postCssProcessor')
	, ensureDirectoryExists = require('../helpers/ensureDirectoryExists')
	, removeCompiledFiles = require('../helpers/removeCompiledFiles')
	, manifest = require('../manifest')
	, updateWatcher = require('../helpers/updateWatcher');

UI_register('sass', 'Sass');

// Variables
// =========================================================================

const entries = config.sass.entry.map((entry, i) => ({
	path: entry,
	name: path.basename(entry),
	dir: path.dirname(entry),
	output: config.sass.output[i],
}));

const watchers = [];

let running = 0;

// Methods
// =========================================================================

/**
 * Start watching for changes to any of the Sass entry files, or files they
 * import
 *
 * @return {Promise<void>}
 */
async function startWatchers () {
	UI_message('sass', 'Starting watchers');

	for (let i = 0, l = entries.length; i < l; i++) {
		const entry = entries[i];

		try {
			const { imports } = await compile(entry);

			const watcher = chokidar.watch(imports, {
				ignoreInitial:          true,
				ignorePermissionErrors: true,
			});

			watcher.on('all', () => compile(entry));
			watchers[entry.path] = { watcher, imports };
		} catch (e) {
			UI_error('sass', e);
		}
	}
}

/**
 * Compiles the given entry
 *
 * @param {Object} entry - The entry to compile
 * @return {Promise<{imports: []}>} - The imports from the rendered entry
 */
async function compile (entry) {
	run();
	UI_message('sass', `Compiling ${entry.name}`);

	let imports = [];

	try {
		// Compile Sass
		let { css, map, imports: _imports } = render(entry);
		imports = _imports;

		// Update the watcher
		updateWatcher(watchers[entry.path], entry, imports);

		// Finish early if the compiled css is empty
		if (!css) {
			UI_warning('sass', `${entry.name} is empty, nothing compiled!`);
			complete();
			return { imports };
		}

		// Hash the filename
		const output = hashFilename(entry.output, css);

		// Run through PostCSS
		const compiled = await postCssProcessor.process(css, {
			from: entry.path,
			to:   output,
			map:  { inline: false, prev: map },
		});

		// Ensure the output directory exists
		ensureDirectoryExists(output);

		// Remove previously compiled files
		removeCompiledFiles(entry.output);

		// Write newly compiled files
		fs.writeFileSync(output, compiled.css);

		// Write sourcemap
		fs.writeFileSync(output + '.map', JSON.stringify(compiled.map));

		// Update the manifest
		manifest.write(entry.name, path.basename(output));

		// TODO: BrowserSync?
	} catch (e) {
		UI_error('sass', e);
	}

	complete();
	return { imports };
}

// Export
// =========================================================================

module.exports = async () => {
	if (nodeEnv() !== 'production')
		await startWatchers();
	else for (let i = 0, l = entries.length; i < l; i++)
		await compile(entries[i]);
};

// Helpers
// =========================================================================

/**
 * Start the Sass task running (if it isn't already)
 */
function run () {
	if (running === 0)
		UI_run('sass');

	running++;
}

/**
 * Complete the Sass task (if everything has finished running)
 */
function complete () {
	running--;

	if (running === 0)
		UI_complete('sass');
}

/**
 * Render the Sass
 *
 * @param {Object} entry - The entry to render
 * @return {{css: null|string, imports: Array, map: string}}
 */
function render (entry) {
	try {
		const result = sass.renderSync({
			file: entry.path,
			sourceMap: true,
		});

		return {
			css: result.css.toString(),
			map: result.map ? JSON.stringify(result.map) : null,
			imports: result.stats.includedFiles,
		};
	} catch (e) {
		throw e;
	}
}
