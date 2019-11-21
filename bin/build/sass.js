const path = require('path')
	, fs = require('fs')
	, postCss = require('postcss')
	, chokidar = require('chokidar')
	, sass = require('node-sass')
	, crypto = require('crypto')
	, ensureDirectoryExists = require('../helpers/ensureDirectoryExists');

class Sass {

	constructor (config, gui, reload, manifest) {
		this.gui = gui;
		this.reload = reload;
		this.manifest = manifest;
		this.running = 0;

		this.entries = config.entry.map((entry, i) => ({
			path: entry,
			name: path.basename(entry),
			dir: path.dirname(entry),
			output: config.output[i],
		}));

		this.postCssProcessor = postCss([
			require('postcss-custom-properties')({ preserve: true }),
			require('autoprefixer')({
				overrideBrowserslist: [
					'>1%',
					'last 2 versions',
					'Firefox ESR',
					'not dead',
					'not ie <= 10',
				],
				flexbox: 'no-2009',
				grid: true,
			}),
			require('cssnano')({
				preset: ['advanced', {
					zindex: false,
				}],
			}),
		]);

		return new Promise(async resolve => {
			if (process.env.NODE_ENV !== 'production')
				await this.startWatchers();
			else
				await this.entries.forEach(this.render.bind(this));

			resolve();
		});
	}

	// Actions
	// =========================================================================

	async startWatchers () {
		this.watchers = [];

		for (let i = 0, l = this.entries.length; i < l; ++i) {
			const entry = this.entries[i];

			try {
				const { imports } = await this.render(entry);

				const watcher = chokidar.watch(
					imports, // sass includes the entry file in its imports
					{
						ignoreInitial:          true,
						ignorePermissionErrors: true,
					}
				);

				watcher.on('all', this.render.bind(this, entry));

				this.watchers[entry.path] = { watcher, imports };
			} catch (e) {
				this.gui.error(e);
			}
		}
	}

	async render (entry) {
		this._run();

		let _imports = [];

		try {
			// Compile Sass
			let { css, map, imports } = await this._renderSass(entry);
			_imports = imports;

			// Update watcher
			if (this.watchers !== void 0)
				this._updateWatcher(entry, imports);

			// Skip if empty
			if (css === null) {
				this.gui.message('SASS is empty, nothing compiled!');
				this._complete();
				return { imports };
			}

			// TODO: Fix sourcemap paths?

			// Hash filename
			const output = this._hashFilename(entry.output, css);

			// Run through PostCSS
			const compiled = await this.postCssProcessor.process(css, {
				from: entry.path,
				to:   output,
				map:  { inline: false, prev: map },
			});

			// Ensure output dir exists
			ensureDirectoryExists(output);

			// Remove previous
			await this._removeOld(entry);

			// Write CSS
			fs.writeFileSync(
				output,
				compiled.css
			);

			// Write Map
			fs.writeFileSync(output + '.map', compiled.map);

			// Update manifest
			this.manifest(entry.name, path.basename(output));

			// BrowserSync reload
			this.reload();
		} catch (e) {
			this.gui.error(e);
		}

		this._complete();
		return { imports: _imports };
	}

	// Helpers
	// =========================================================================

	_run () {
		if (this.running === 0)
			this.gui.run();

		this.running++;
	}

	_complete () {
		this.running--;

		if (this.running === 0)
			this.gui.complete();
	}

	async _renderSass (entry) {
		return new Promise(((resolve, reject) => {
			sass.render({
				file: entry.path,
			}, (error, result) => {
				if (error)
					return reject(error);

				resolve({
					css: result.css.toString(),
					map: JSON.stringify(result.map),
					imports: result.stats.includedFiles,
				});
			});
		}));
	}

	_updateWatcher (entry, imports) {
		if (!this.watchers[entry.path])
			return;

		const { watcher, imports: oldImports } = this.watchers[entry.path];

		const added   = imports.filter(p => !oldImports.includes(p));
		const removed = oldImports.filter(p => !imports.includes(p));

		if (added.length > 0) watcher.add(added);
		if (removed.length > 0) watcher.unwatch(removed);
	}

	_hashFilename (filename, fileContents) {
		const hash = /\[hash:(\d+)]/g.exec(filename);
		if (!hash)
			return filename;

		const h = hash[0]
			, l = +hash[1];

		const hasher = crypto.createHash('sha1');
		hasher.setEncoding('hex');
		hasher.write(fileContents);
		hasher.end();
		let hashString = hasher.read().substr(0, l);

		return filename.replace(h, hashString);
	}

	async _removeOld (entry) {
		return new Promise(resolve => {
			const name = path.basename(entry.output)
				, dir  = path.dirname(entry.output);

			const hash = /\[hash:(\d+)]/g.exec(name);
			let regex;

			const output = name.replace(/\./g, "\\.");

			if (hash) {
				regex = new RegExp("^" + output.replace(
					hash[0],
					"[a-z\\d]{" + hash[1] + "}"
				) + "(\\.map)?$");
			} else {
				regex = new RegExp("^" + output + "(\\.map)?$");
			}

			const files = fs.readdirSync(dir).filter(name => regex.test(name));

			for (let i = 0, l = files.length; i < l; ++i)
				fs.unlinkSync(path.join(dir, files[i]));

			resolve();
		});
	}

}

module.exports = Sass;
