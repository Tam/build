const webpack = require("webpack")
	, fs = require("fs")
	, eslintFormatter = require("../helpers/eslintFormatter")
	, BuildWebpackPlugin = require("../plugins/BuildWebpackPlugin");

class JS {

	constructor (config, gui, reload, manifest) {
		const isProd = process.env.NODE_ENV === "production";
		this.gui = gui;

		// TODO: Get previous files somehow (incl. chunks)...
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

			const info = stats.toJson();
			// gui.message(JSON.stringify(info, null, 2));

			await this._removePrevious();
			this.previousFiles = [];

			Object.keys(info.entrypoints).forEach(key => {
				this.previousFiles.push(info.entrypoints[key].assets[0]);

				manifest(
					key + ".js",
					info.entrypoints[key].assets[0]
				);
			});

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
				for (let i = 0, l = this.previousFiles.length; i < l; ++i) {
					fs.unlinkSync(this.previousFiles[i]);
					fs.unlinkSync(this.previousFiles[i] + ".map");
				}
			} catch (e) {
				this.gui.error(e);
			}

			resolve();
		});
	}

}

module.exports = JS;