const webpack = require("webpack")
	, fs = require("fs")
	, path = require("path")
	, jsLintingRule = require("../rules/js-linting")
	, jsRule = require("../rules/js")
	, BuildWebpackPlugin = require("../plugins/BuildWebpackPlugin");

class JS {

	constructor (config, gui, reload, manifest) {
		const isProd = process.env.NODE_ENV === "production";
		this.gui = gui;
		this.previousFiles = [];

		webpack({
			devtool: isProd ? "source-map" : "cheap-module-source-map",

			mode: process.env.NODE_ENV || "development",

			entry: config.entry,
			output: config.output,

			module: {
				rules: [
					// Linting
					jsLintingRule(config),

					// Babel
					jsRule(config),
				],
			},

			plugins: [
				new BuildWebpackPlugin(gui),
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
		}).watch({
			ignored: /node_modules/,
		}, async (err, stats) => {
			if (err) {
				gui.error(err);
				gui.complete();
				return;
			}

			const meta = stats.toJson();
			// gui.error(JSON.stringify(meta, null, 2));

			await this._removePrevious();
			this.previousFiles = meta.assets.map(
				asset => path.join(meta.outputPath, asset.name)
			);

			Object.keys(meta.entrypoints).forEach(key => {
				manifest(
					key + ".js",
					meta.entrypoints[key].assets[0]
				);
			});

			const info = stats.toJson("errors-only");

			if (stats.hasErrors()) {
				info.errors.forEach(gui.error);
				gui.complete();
				return;
			}

			if (stats.hasWarnings())
				info.warnings.forEach(gui.warning);

			gui.complete();
			reload();
		});
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

}

module.exports = JS;
