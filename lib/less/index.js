const config = require('../config')
	, { UI_register, UI_run, UI_complete, UI_message, UI_error, UI_warning } = require('../gui')
	, path = require('path')
	, nodeEnv = require('../helpers/getNodeEnv')
	, chokidar = require('chokidar')
	, updateWatcher = require('../helpers/updateWatcher')
	, hashFilename = require('../helpers/hashFilename')
	, postCssProcessor = require('../helpers/postCssProcessor')
	, ensureDirectoryExists = require('../helpers/ensureDirectoryExists')
	, removeCompiledFiles = require('../helpers/removeCompiledFiles')
	, fs = require('fs')
	, manifest = require('../manifest')
	, less = require('less');

UI_register('less', 'Less');

// Variables
// =========================================================================

const entries = config.less.entry.map((entry, i) => ({
	path: entry,
	name: path.basename(entry),
	dir: path.dirname(entry),
	output: config.less.output[i],
}));

const watchers = [];

let running = 0;

// Methods
// =========================================================================

/**
 * Start watching for changes to any of the Less entry files, or files they
 * import
 *
 * @return {Promise<void>}
 */
async function startWatchers () {
	UI_message('less', 'Starting watchers');

	for (let i = 0, l = entries.length; i < l; i++) {
		const entry = entries[i];

		try {
			const { imports } = await compile(entry);

			const watcher = chokidar.watch([entry.path, ...imports], {
				ignoreInitial:          true,
				ignorePermissionErrors: true,
			});

			watcher.on('all', () => compile(entry));
			watchers[entry.path] = { watcher, imports };
		} catch (e) {
			UI_error('less', e);
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
	UI_message('less', `Compiling ${entry.name}`);

	let imports = [];

	try {
		// Compile Less
		let { css, map, imports: _imports } = await render(entry);
		imports = _imports;

		// Update the watcher
		updateWatcher(watchers[entry.path], entry, imports);

		// Finish early if the compiled css is empty
		if (!css) {
			UI_warning('less', `${entry.name} is empty, nothing compiled!`);
			complete();
			return { imports };
		}

		// Fix source map paths
		map = JSON.parse(map);
		map.sources = map.sources.map(s => s.replace(entry.dir + '/', ''));
		map = JSON.stringify(map);

		// Hash the filename
		const output = hashFilename(entry.output, css);

		// Run though PostCSS
		const compiled = await postCssProcessor.process(css, {
			from: entry.path,
			to:   output,
			map:  { inline: false, prev: map },
		});

		// Ensure the output directory exists
		ensureDirectoryExists(output);

		// Remove previously compiled files
		removeCompiledFiles(entry.output);

		// Write CSS
		fs.writeFileSync(
			output,
			compiled.css + `\r\n/*# sourceMappingURL=${path.basename(output)}.map */`
		);

		// Write Map
		fs.writeFileSync(output + '.map', compiled.map);

		// Update the manifest
		manifest.write(entry.name, path.basename(output));

		// TODO: BrowserSync?
	} catch (e) {
		UI_error('less', e);
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
		UI_run('less');

	running++;
}

/**
 * Complete the Sass task (if everything has finished running)
 */
function complete () {
	running--;

	if (running === 0)
		UI_complete('less');
}

/**
 * Render the Less
 *
 * @param {Object} entry - The entry to render
 * @return {Promise<{css: null|string, imports: [], map: null|string}|*>}
 */
async function render (entry) {
	try {
		const css = fs.readFileSync(entry.path, 'utf8');

		if (css.trim() === '')
			return { css: null, map: null, imports: [] };

		return await less.render(css, {
			filename: entry.name,
			paths: [entry.dir],
			relativeUrls: false,
			sourceMap: {},
		});
	} catch (e) {
		throw e;
	}
}
