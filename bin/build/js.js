const webpack = require("webpack")
	, fs = require("fs")
	, path = require("path")
	, eslintFormatter = require("../helpers/eslintFormatter")
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
					{
						test: /\.(js)$/,
						enforce: 'pre',
						use: {
							loader: require.resolve('eslint-loader'),
							options: {
								formatter: eslintFormatter,
								eslintPath: require.resolve("eslint"),
								baseConfig: {
									parserOptions: {
										ecmaVersion: 7,
										sourceType: "module"
									},
									extends: "eslint:recommended",
									parser: "babel-eslint",
									rules: {
										eqeqeq: [1, "smart"],
										semi: [1, "always"],
										"no-loop-func": [2],
										"no-unused-vars": [1],
										"no-console": [1],
										"no-mixed-spaces-and-tabs": [0],
									},
									env: {
										browser: true,
										es6: true,
									},
								},
							},
						},
						include: config.entry.path,
						exclude: /(node_modules)/,
					},

					// Babel
					{
						test: /\.(js)$/,
						use: {
							loader: require.resolve('babel-loader'),
							options: {
								presets: [require.resolve('@babel/preset-env')],
								plugins: [
									require.resolve("@babel/plugin-external-helpers"),
									require.resolve("@babel/plugin-syntax-dynamic-import"),
									require.resolve("@babel/plugin-proposal-class-properties"),
								],
								cacheDirectory: true,
							},
						},
						include: config.entry.path,
						exclude: /(node_modules)/,
					}
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

			const nextFiles = meta.assets.map(
				asset => path.join(meta.outputPath, asset.name)
			);
			this.previousFiles = this.previousFiles.filter(p => !nextFiles.includes(p));
			await this._removePrevious();
			this.previousFiles = nextFiles;

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
				info.warnings.map(
					w => w.split("\n").filter(l => l.indexOf("Module Warning") === -1)
				).forEach(gui.warning);

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