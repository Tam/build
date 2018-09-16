const webpack = require("webpack")
	, eslintFormatter = require("../helpers/eslintFormatter");

class JS {

	constructor (config, gui, reload, manifest) {
		webpack({
			devtool: 'cheap-module-source-map',

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
								cacheDirectory: true,
							},
						},
						include: config.entry.path,
						exclude: /(node_modules)/,
					}
				],
			},

			plugins: [
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
		}, (err, stats) => {
			gui.run();

			if (err) {
				gui.error(err);
				gui.complete();
				return;
			}

			const info = stats.toJson();
			// gui.message(JSON.stringify(info, null, 2));

			if (stats.hasErrors()) {
				info.errors.forEach(gui.error);
				gui.complete();
				return;
			}

			Object.keys(info.entrypoints).forEach(key => {
				manifest(
					key + ".js",
					info.entrypoints[key].assets[0]
				);
			});

			if (stats.hasWarnings())
				info.warnings.forEach(gui.warning);

			gui.complete(info.time);
			reload();
		});
	}

}

module.exports = JS;