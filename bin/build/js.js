const webpack = require("webpack")
	, fs = require("fs")
	, path = require("path")
	, jsLintingRule = require("../rules/js-linting")
	, jsRule = require("../rules/js")
	, BuildWebpackPlugin = require("../plugins/BuildWebpackPlugin");

class JS {

	constructor (config, gui, reload, manifest) {
		this.isProd = process.env.NODE_ENV === "production";
		this.config = config;
		this.gui = gui;
		this.reload = reload;
		this.manifest = manifest;
		this.previousFiles = [];

		return new Promise(async resolve => {
			if (this.isProd) {
				await this.webpack().run(async (err, stats) => {
					await this.callback(err, stats);
					resolve();
				});
			} else {
				await this.webpack().watch({
					ignored: /node_modules/,
				}, this.callback.bind(this));
				resolve();
			}
		});
	}

	webpack () {
		return webpack({
			devtool: this.isProd ? "source-map" : "cheap-module-eval-source-map",

			mode: process.env.NODE_ENV || "development",

			entry: this.config.entry,
			output: this.config.output,

			module: {
				rules: [
					// Linting
					jsLintingRule(this.config),

					// Babel
					jsRule(this.config),
				],
			},

			plugins: [
				new BuildWebpackPlugin(this.gui),
				new webpack.NamedModulesPlugin(),
				new webpack.DefinePlugin({
					'process.env': {
						NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development")
					}
				}),
			],

			node: {
				dgram: 'empty',
				fs: 'empty',
				net: 'empty',
				tls: 'empty',
				child_process: 'empty',
			},

			performance: {
				hints: false,
			},
		});
	}

	async callback (err, stats) {
		if (err) {
			this.gui.error(err);
			this.gui.complete();
			return;
		}

		const meta = stats.toJson();
		// gui.error(JSON.stringify(meta, null, 2));

		const nextFiles = meta.assets.map(
			asset => path.join(meta.outputPath, asset.name)
		);
		this.previousFiles = this.previousFiles.filter(p => !nextFiles.includes(p));
		await this._removePrevious();
		this.previousFiles = nextFiles;

		Object.keys(meta.entrypoints).forEach(key => {
			this.manifest(
				key + ".js",
				meta.entrypoints[key].assets[0]
			);
		});

		const info = stats.toJson("errors-only");

		if (stats.hasErrors()) {
			info.errors.map(this._tidyWebpackMessages).forEach(this.gui.error);
			this.gui.complete();
			return;
		}

		if (stats.hasWarnings())
			info.warnings.map(this._tidyWebpackMessages).forEach(this.gui.warning);

		this.gui.complete();
		this.reload();
	}

	// Helpers
	// =========================================================================

	async _removePrevious () {
		return new Promise(resolve => {
			try {
				for (let i = 0, l = this.previousFiles.length; i < l; ++i)
					fs.unlinkSync(this.previousFiles[i]);
			} catch (e) {
				this.gui.error(e);
			}

			resolve();
		});
	}

	_tidyWebpackMessages (m) {
		return m.split("\n").filter(l => (
			l.indexOf("Module Warning") === -1
			&& l.indexOf("Module Error") === -1
			&& l.indexOf("Module build failed") === -1
			&& l.indexOf("at _class") === -1
		)).map(l => (
			l.replace(/\t|\s{8}/g, "    ")
				.replace(process.cwd() + "/", "")
		));
	}

}

module.exports = JS;
