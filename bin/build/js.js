const webpack = require("webpack")
	, fs = require("fs")
	, path = require("path")
	, glob = require("glob")
	, eslintFormatter = require("../helpers/eslintFormatter")
	, BuildWebpackPlugin = require("../plugins/BuildWebpackPlugin")
	, merge = require('webpack-merge');

class JS {

	constructor (config, gui, reload, manifest) {
		this.isProd = process.env.NODE_ENV === "production";
		this.config = config;
		this.gui = gui;
		this.reload = reload;
		this.manifest = manifest;
		this.previousFiles = [];

		return new Promise(async resolve => {
			await this._removeOld(this.config.output.filename);
			await this._removeOld(this.config.output.chunkFilename);

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
		return webpack(merge.smart({
			devtool: this.isProd ? "source-map" : "cheap-module-eval-source-map",

			mode: process.env.NODE_ENV || "development",

			entry: this.config.entry,
			output: this.config.output,

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
						include: this.config.entry.path,
						exclude: /(node_modules)/,
					},

					{
						test: /\.(ts)$/,
						enforce: 'pre',
						use: {
							loader: require.resolve('eslint-loader'),
							options: {
								parser: require.resolve('@typescript-eslint/parser'),
								plugins: [
									// require.resolve('@typescript-eslint/eslint-plugin'),
									'@typescript-eslint',
								],
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
					},

					// Babel
					{
						test: /\.(js)$/,
						use: {
							loader: require.resolve("babel-loader"),
							options: {
								presets: [
									[
										require.resolve("@babel/preset-env"),
										{
											// useBuiltIns: 'usage',
											useBuiltIns: false,
											targets: '> 1%, last 2 versions, Firefox ESR, not dead, not ie <= 10',
										},
									],
									require.resolve("@babel/preset-flow"),
								],
								plugins: [
									[
										require.resolve('@babel/plugin-transform-runtime'),
										{
											corejs: false,
											helpers: true,
											regenerator: true,
											useESModules: false,
										},
									],
									require.resolve("@babel/plugin-syntax-dynamic-import"),
									require.resolve("@babel/plugin-proposal-class-properties"),
								],
								cacheDirectory: true,
							},
						},
						include: this.config.entry.path,
						exclude: /(node_modules)\/(?!(ether-[\w\d-_]+)\/).*/,
					},

					{
						test: /\.(ts)$/,
						use: {
							loader: require.resolve("babel-loader"),
							options: {
								presets: [
									[
										require.resolve("@babel/preset-env"),
										{
											// useBuiltIns: 'usage',
											useBuiltIns: false,
											targets: '> 1%, last 2 versions, Firefox ESR, not dead, not ie <= 10',
										},
									],
									require.resolve("@babel/preset-typescript"),
								],
								plugins: [
									[
										require.resolve('@babel/plugin-transform-runtime'),
										{
											corejs: false,
											helpers: true,
											regenerator: true,
											useESModules: false,
										},
									],
									require.resolve("@babel/plugin-syntax-dynamic-import"),
									require.resolve("@babel/plugin-proposal-class-properties"),
								],
								cacheDirectory: true,
							},
						},
						include: this.config.entry.path,
						exclude: /(node_modules)\/(?!(ether-[\w\d-_]+)\/).*/,
					}
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

			resolve: {
				modules: [
					path.relative(
						process.cwd(),
						path.resolve(__dirname, '../../node_modules')
					),
					'node_modules',
				],
			}
		}, this.config.config || {}));
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
					if (fs.existsSync(this.previousFiles[i]))
						fs.unlinkSync(this.previousFiles[i]);
			} catch (e) {
				this.gui.error(e);
			}

			resolve();
		});
	}

	async _removeOld (filename) {
		if (!filename || typeof filename !== 'string')
			return Promise.resolve();

		filename = filename.replace(/\[[^\[]+]/g, '*') + '?(.map)';

		glob(filename, {
			cwd: this.config.output.path,
			absolute: true,
		}, (er, files) => {
			files.forEach(fs.unlinkSync);
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
